import os
from os.path import join, dirname
from dotenv import load_dotenv

from pymongo import MongoClient
import jwt
from datetime import datetime, timedelta
import hashlib
from flask import Flask, render_template, jsonify, request, redirect, url_for
from werkzeug.utils import secure_filename

dotenv_path = join(dirname(__file__), '.env')
load_dotenv(dotenv_path)

MONGODB_URI = os.environ.get("MONGODB_URI")
DB_NAME =  os.environ.get("DB_NAME")

app = Flask(__name__)

app.config['TEMPLATES_AUTO_RELOAD'] = True
app.config['UPLOAD_FOLDER'] = '../static/profile_pics'

SECRET_KEY = ''

MONGODB_CONNECTION_STRING = 'mongodb+srv://test:sparta@cluster0.xf06gif.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'

client = MongoClient(MONGODB_URI)

db = client[DB_NAME]

TOKEN_KEY = 'mytoken'
 
@app.route('/', methods=['GET'])
def home():
    token_receive = request.cookies.get(TOKEN_KEY)
    try:
        payload = jwt.decode(token_receive, SECRET_KEY, algorithms=['HS256'])
        user_info = db.users.find_one({'username': payload.get('id')})
        # print(user_info)
        return render_template('index.html', user_info=user_info)
    except jwt.ExpiredSignatureError:
        msg = "silahkan login"
        return redirect(url_for("login", msg=msg))
    except jwt.exceptions.DecodeError:
        msg = "login dulu"
        return redirect(url_for("login", msg=msg))
    
@app.route('/login', methods= ['GET'])
def login():
    msg = request.args.get('msg')
    return render_template('login.html', msg=msg)

@app.route('/user/<username>', methods=['GET'])
def user(username):
    token_receive = request.cookies.get(TOKEN_KEY)
    try:
        payload = jwt.decode(token_receive, SECRET_KEY, algorithms=['HS256'])
        status = username == payload.get('id')
        user_info = db.users.find_one(
            {'username': username}, 
            {'_id': False}
            )
        # print(user_info)
        return render_template('user.html', user_info=user_info, status=status)
    except (jwt.ExpiredSignatureError, jwt.exceptions.DecodeError):
        return redirect(url_for("home"))
    
@app.route('/sign_in', methods=['POST'])
def sign_in():
    un_receive = request.form["un_give"]
    pw_receive = request.form["pw_give"]
    pw_hash = hashlib.sha256(pw_receive.encode("utf-8")).hexdigest()
    # print(un_receive)
    result = db.users.find_one({
            "username": un_receive,
            "password": pw_hash,
        })
    if result:
        payload = {
            "id": un_receive,
            "exp": datetime.utcnow() + timedelta(seconds=60 * 60 * 24),
        }
        token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")
        return jsonify({
                "result": "success",
                "token": token,
            })
    else:
        return jsonify({
                "result": "fail",
                "msg": "We could not find a user with that id/password combination",
            })

@app.route('/sign_up/save', methods=['POST'])
def sign_up():
    un_receive = request.form.get('un_give')
    pw_receive = request.form.get('pw_give')
    
    pw_hash = hashlib.sha256(pw_receive.encode('utf-8')).hexdigest()
    
    doc = {
        "username": un_receive,
        "password": pw_hash,
        "profile_name": un_receive,
        "profile_pic": "",
        "profile_pic_real": "profile_pics/profile_placeholder.png",
        "profile_info": ""
    }
    
    
    user = db.users.find_one({"username": un_receive})
    # print(user)
    exists = bool(user)
    # print(exists)
    
    db.users.insert_one(doc)
    
    return jsonify({'result': 'success', 'exists': exists})

@app.route('/sign_up/check_dup', methods=['POST'])
def check_dup():
    return jsonify({'result' : 'success'})

@app.route('/up_profile', methods=['POST'])
def up_profile():
    token_receive = request.cookies.get(TOKEN_KEY)
    try:
        payload = jwt.decode(token_receive, SECRET_KEY, algorithms=["HS256"])
        username = payload["id"]
        name_receive = request.form["name_give"]
        about_receive = request.form["about_give"]
        new_doc = {"profile_name": name_receive, "profile_info": about_receive} 
        new_post = {"profile_name": name_receive} 
        if "file_give" in request.files:
            file = request.files["file_give"]
            filename = secure_filename(file.filename)
            extension = filename.split(".")[-1]
            file_path = f"profile_pics/{username}.{extension}"
            file.save("./static/" + file_path)
            new_doc["profile_pic"] = filename
            new_doc["profile_pic_real"] = file_path
            new_post["profile_pic"] = filename
            new_post["profile_pic_real"] = file_path
        db.users.update_one({"username": payload["id"]}, {"$set": new_doc})
        db.posts.update_many({"username": payload["id"]}, {"$set": new_post})
        return jsonify({"result": "success", "msg": "Profile updated!"})
    except (jwt.ExpiredSignatureError, jwt.exceptions.DecodeError):
        return redirect(url_for("home"))
    
@app.route('/posting', methods=['POST'])
def posting():
    token_receive = request.cookies.get(TOKEN_KEY)
    try:
        payload = jwt.decode(token_receive, SECRET_KEY, algorithms=["HS256"])
        user_info = db.users.find_one({"username": payload["id"]})
        text_receive = request.form["text_give"]
        date_receive = request.form["date_give"]
        # print(text_receive)
        doc = {
            "username": user_info["username"],
            "profile_name": user_info["profile_name"],
            "profile_pic_real": user_info["profile_pic_real"],
            "text": text_receive,
            "date": date_receive,
        }
        db.posts.insert_one(doc)
        return jsonify({"result": "success", "msg": "Posting successful!"})
    except (jwt.ExpiredSignatureError, jwt.exceptions.DecodeError):
        return redirect(url_for("home"))
    
@app.route('/get_post', methods=['GET'])
def method_name():
    token_receive = request.cookies.get(TOKEN_KEY)
    try:
        payload = jwt.decode(token_receive, SECRET_KEY, algorithms=["HS256"])

        un_receive = request.args.get("un_give")
        if un_receive == "":
            posts = list(db.posts.find({}).sort("date", -1).limit(20))
        else:
            posts = list(
                db.posts.find({"username": un_receive}).sort("date", -1).limit(20)
            )

        for post in posts:
            post["_id"] = str(post["_id"])
            post["count_heart"] = db.likes.count_documents({"post_id": post["_id"], "type": "heart"})
            post["heart_by_me"] = bool(db.likes.find_one({"post_id": post["_id"], "type": "heart", "username": payload["id"]}))
            
            post["count_star"] = db.likes.count_documents({"post_id": post["_id"], "type": "star"})
            post["star_by_me"] = bool(db.likes.find_one({"post_id": post["_id"], "type": "star", "username": payload["id"]}))
            
            post["count_tumb"] = db.likes.count_documents({"post_id": post["_id"], "type": "tumb"})
            post["tumb_by_me"] = bool(db.likes.find_one({"post_id": post["_id"], "type": "tumb", "username": payload["id"]}))
        return jsonify(
            {
                "result": "success",
                "msg": "Successful fetched all posts",
                "posts": posts,
            }
        )
    except (jwt.ExpiredSignatureError, jwt.exceptions.DecodeError):
        return redirect(url_for("home"))
    
@app.route('/up_like', methods=['POST'])
def up_like():
    token_receive = request.cookies.get(TOKEN_KEY)
    try:
        payload = jwt.decode(token_receive, SECRET_KEY, algorithms=["HS256"])
        # We should change the like count for the post here
        user_info = db.users.find_one({"username": payload["id"]})
        post_id_receive = request.form["post_id_give"]
        type_receive = request.form["type_give"]
        action_receive = request.form["action_give"]
        
        # print(action_receive)
        doc = {
            "post_id": post_id_receive,
            "username": user_info["username"],
            "type": type_receive,
        }
        
        if action_receive == "like":
            db.likes.insert_one(doc)
        else:
            db.likes.delete_one(doc)
        count = db.likes.count_documents(
            {"post_id": post_id_receive, "type": type_receive}
        )
        return jsonify({"result": "success", "msg": "updated", "count": count})
    except (jwt.ExpiredSignatureError, jwt.exceptions.DecodeError):
        return redirect(url_for("home"))
        
@app.route('/about')
def about():
    return render_template('about.html')

@app.route('/secret')
def secret():
    token_receive = request.cookies.get(TOKEN_KEY)
    try:
        payload = jwt.decode(token_receive, SECRET_KEY, algorithms=['HS256'])
        user_info = db.users.find_one({'username' : payload.get('id')})
        return render_template('secret.html', user_info=user_info)
    except (jwt.ExpiredSignatureError, jwt.exceptions.DecodeError):
        return redirect(url_for("home"))
    

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)
 