import hashlib
import time
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import jwt
from functools import wraps
import logging
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.backends import default_backend
from cryptography.exceptions import InvalidSignature

app = Flask(__name__)

# Enable CORS
CORS(app)

app.secret_key = 'your_secret_key'  # Needed for JWT

# Configure logging
logging.basicConfig(level=logging.DEBUG)

class User:
    def __init__(self, username):
        self.username = username
        self.balance = 0
        self.pending_transactions = []
        self.private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
            backend=default_backend()
        )
        self.public_key = self.private_key.public_key()

    @staticmethod
    def from_dict(data):
        user = User(data['username'])
        user.balance = data['balance']
        user.pending_transactions = [Transaction(tx['sender'], tx['receiver'], tx['amount'], tx['signature']) for tx in data['pending_transactions']]
        user.private_key = serialization.load_pem_private_key(
            data['private_key'].encode(),
            password=None,
            backend=default_backend()
        )
        user.public_key = user.private_key.public_key()
        return user

    def to_dict(self):
        return {
            "username": self.username,
            "balance": self.balance,
            "pending_transactions": [tx.to_dict() for tx in self.pending_transactions],
            "private_key": self.private_key.private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.PKCS8,
                encryption_algorithm=serialization.NoEncryption()
            ).decode(),
            "public_key": self.public_key.public_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PublicFormat.SubjectPublicKeyInfo
            ).decode().replace("-----BEGIN PUBLIC KEY-----\n", "").replace("-----END PUBLIC KEY-----\n", "").replace("\n", "")
        }

class Transaction:
    def __init__(self, sender, receiver, amount, signature=None):
        self.sender = sender
        self.receiver = receiver
        self.amount = amount
        self.signature = signature

    def to_dict(self):
        sender_user = blockchain.users[self.sender]
        sender_public_key = sender_user.public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        ).decode().replace("-----BEGIN PUBLIC KEY-----\n", "").replace("-----END PUBLIC KEY-----\n", "").replace("\n", "")
        return {
            "sender": sender_public_key,
            "receiver": self.receiver,
            "amount": self.amount,
            "signature": self.signature
        }

    def sign_transaction(self, private_key):
        message = f"{self.sender}{self.receiver}{self.amount}".encode()
        self.signature = private_key.sign(
            message,
            padding.PSS(
                mgf=padding.MGF1(hashes.SHA256()),
                salt_length=padding.PSS.MAX_LENGTH
            ),
            hashes.SHA256()
        ).hex()

    def verify_signature(self, public_key):
        message = f"{self.sender}{self.receiver}{self.amount}".encode()
        try:
            public_key.verify(
                bytes.fromhex(self.signature),
                message,
                padding.PSS(
                    mgf=padding.MGF1(hashes.SHA256()),
                    salt_length=padding.PSS.MAX_LENGTH
                ),
                hashes.SHA256()
            )
            return True
        except InvalidSignature:
            return False

class Block:
    def __init__(self, index, timestamp, transactions, previous_hash):
        self.index = index
        self.timestamp = timestamp
        self.transactions = [tx.to_dict() for tx in transactions]  # Convert transactions to dicts
        self.previous_hash = previous_hash
        self.hash = self.calculate_hash()

    def calculate_hash(self):
        block_string = json.dumps(self.__dict__, sort_keys=True)
        return hashlib.sha256(block_string.encode()).hexdigest()

    def mine_block(self, difficulty):
        target = '0' * difficulty
        while self.hash[:difficulty] != target:
            self.timestamp = time.time()
            self.hash = self.calculate_hash()

class Blockchain:
    def __init__(self, difficulty=2, mining_reward=50):
        self.chain = []
        self.difficulty = difficulty
        self.mining_reward = mining_reward
        self.users = self.load_users()  # Load users from the file
        self.create_genesis_block()

    def create_genesis_block(self):
        genesis_block = Block(0, time.time(), [], '0')
        self.chain.append(genesis_block)

    def load_users(self):
        if os.path.exists("users.json"):
            with open("users.json", "r") as file:
                try:
                    user_data = json.load(file)
                    return {username: User.from_dict(data) for username, data in user_data.items()}
                except json.JSONDecodeError:
                    return {}
        return {}

    def save_users(self):
        with open("users.json", "w") as file:
            # Convert each user to a dictionary before saving
            user_data = {username: user.to_dict() for username, user in self.users.items()}
            json.dump(user_data, file)

    def register_user(self, username):
        if username in self.users:
            return False
        self.users[username] = User(username)
        self.save_users()  # Save the user to the file
        return True

    def add_transaction(self, sender, receiver_public_key, amount):
        if sender not in self.users:
            logging.error(f"Invalid sender: {sender}")
            return False  # Ensure valid sender

        sender_user = self.users[sender]
        receiver_user = None

        # Normalize the receiver public key
        normalized_receiver_public_key = receiver_public_key.strip()

        # Find the receiver by public key
        for user in self.users.values():
            stored_public_key = user.public_key.public_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PublicFormat.SubjectPublicKeyInfo
            ).decode().replace("-----BEGIN PUBLIC KEY-----\n", "").replace("-----END PUBLIC KEY-----\n", "").replace("\n", "").strip()

            if stored_public_key == normalized_receiver_public_key:
                receiver_user = user
                break

        if not receiver_user:
            logging.error(f"Invalid receiver public key: {normalized_receiver_public_key}")
            return False  # Ensure valid receiver

        if sender_user.balance < amount:
            logging.error(f"Insufficient balance: {sender_user.balance} < {amount}")
            return False  # Insufficient coins

        sender_user.balance -= amount
        receiver_user.balance += amount

        transaction = Transaction(sender, receiver_public_key, amount)
        transaction.sign_transaction(sender_user.private_key)
        self.users[sender].pending_transactions.append(transaction)
        self.save_users()  # Save after transaction
        return True

    def mine_pending_transactions(self, miner_username):
        if miner_username not in self.users:
            return None

        miner_user = self.users[miner_username]
        all_pending_transactions = self.get_pending_transactions()

        if not all_pending_transactions:
            logging.error("No pending transactions to mine")
            return None

        # Verify all transactions
        for tx in all_pending_transactions:
            sender_user = self.users[tx.sender]
            if not tx.verify_signature(sender_user.public_key):
                logging.error(f"Invalid signature for transaction: {tx.to_dict()}")
                return None

        new_block = Block(len(self.chain), time.time(), all_pending_transactions, self.chain[-1].hash)
        new_block.mine_block(self.difficulty)
        self.chain.append(new_block)

        # Reward the miner
        miner_user.balance += self.mining_reward

        # Clear pending transactions for all users
        for user in self.users.values():
            user.pending_transactions = []

        self.save_users()  # Save after mining
        return new_block

    def get_chain(self):
        return self.chain

    def get_pending_transactions(self):
        pending_transactions = []
        for user in self.users.values():
            pending_transactions.extend(user.pending_transactions)
        return pending_transactions

blockchain = Blockchain()

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({'message': 'Token is missing!'}), 401
        try:
            token = auth_header.split(" ")[1]
            data = jwt.decode(token, app.secret_key, algorithms=["HS256"])
            current_user = blockchain.users.get(data['username'])
            if not current_user:
                return jsonify({'message': 'User not found!'}), 404
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token has expired!'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Token is invalid!'}), 401
        return f(current_user, *args, **kwargs)
    return decorated

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    if blockchain.register_user(username):
        user = blockchain.users[username]
        public_key = user.public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        ).decode().replace("-----BEGIN PUBLIC KEY-----\n", "").replace("-----END PUBLIC KEY-----\n", "").replace("\n", "")
        return jsonify({"message": f"User {username} registered successfully!", "public_key": public_key}), 201
    return jsonify({"message": "Username already exists!"}), 400

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')

    # Check if the user exists in the blockchain
    if username not in blockchain.users:
        return jsonify({'message': 'User does not exist!'}), 400

    user = blockchain.users[username]

    # Generate token
    token = jwt.encode({'username': username}, app.secret_key, algorithm="HS256")
    public_key = user.public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    ).decode().replace("-----BEGIN PUBLIC KEY-----\n", "").replace("-----END PUBLIC KEY-----\n", "").replace("\n", "")

    return jsonify({'message': f'Login successful for {username}', 'token': token, 'public_key': public_key})

@app.route('/balance', methods=['GET'])
@token_required
def get_balance(current_user):
    balance = current_user.balance
    return jsonify({"username": current_user.username, "balance": balance}), 200

@app.route('/buy_coins', methods=['POST'])
@token_required
def buy_coins(current_user):
    data = request.get_json()
    amount = data.get('amount')

    try:
        amount = float(amount)
        if amount <= 0:
            return jsonify({"message": "Invalid amount!"}), 400
    except ValueError:
        return jsonify({"message": "Invalid amount!"}), 400

    current_user.balance += amount
    blockchain.save_users()
    return jsonify({"message": f"Successfully bought {amount} coins."}), 200

@app.route('/sell_coins', methods=['POST'])
@token_required
def sell_coins(current_user):
    data = request.get_json()
    amount = data.get('amount')

    try:
        amount = float(amount)
        if amount <= 0:
            return jsonify({"message": "Invalid amount!"}), 400
    except ValueError:
        return jsonify({"message": "Invalid amount!"}), 400

    if current_user.balance < amount:
        return jsonify({"message": "Insufficient balance!"}), 400

    current_user.balance -= amount
    blockchain.save_users()
    return jsonify({"message": f"Successfully sold {amount} coins."}), 200

@app.route('/mine_block', methods=['POST'])
@token_required
def mine_block(current_user):
    new_block = blockchain.mine_pending_transactions(current_user.username)
    if new_block:
        return jsonify({"message": "Block mined successfully!", "block": new_block.__dict__}), 200
    return jsonify({"message": "No transactions to mine!"}), 400

@app.route('/transactions/new', methods=['POST'])
@token_required
def add_transaction(current_user):
    data = request.get_json()
    receiver_public_key = data.get('receiverPublicKey')
    amount = data.get('amount')

    try:
        amount = float(amount)
        if amount <= 0:
            return jsonify({"message": "Invalid amount!"}), 400
    except ValueError:
        return jsonify({"message": "Invalid amount!"}), 400

    if blockchain.add_transaction(current_user.username, receiver_public_key, amount):
        return jsonify({"message": "Transaction added successfully!"}), 201
    return jsonify({"message": "Transaction failed!"}), 400

@app.route('/chain', methods=['GET'])
def get_chain():
    chain_data = [block.__dict__ for block in blockchain.get_chain()]
    return jsonify({"chain": chain_data}), 200

@app.route('/transactions', methods=['GET'])
def get_pending_transactions():
    pending_transactions = [tx.to_dict() for tx in blockchain.get_pending_transactions()]
    return jsonify({"pending_transactions": pending_transactions}), 200

if __name__ == '__main__':
    app.run(debug=True)