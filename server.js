/* jshint esversion : 6 */
const express = require('express');
const passport = require('passport');
const Strategy = require('passport-local').Strategy;
const cookieParser = require('cookie-parser');
const session = require('express-session');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const connectEnsureLogin = require('connect-ensure-login');
const firebase = require('firebase');

const app = express();
const jsonMiddleware = bodyParser.json();

app.use(express.static('public'));
app.use(morgan('tiny'));
app.use(cookieParser());
app.use(session({ secret: 'keyboard cat', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

/*******************************/
/* firebase config & functions */
const config = {
  apiKey: "AIzaSyCqftr9W9LnNW3iV1Irl3HXj-9_BpkLc3M",
  authDomain: "todolist-3b531.firebaseapp.com",
  databaseURL: "https://todolist-3b531.firebaseio.com",
  projectId: "todolist-3b531",
  storageBucket: "todolist-3b531.appspot.com",
  messagingSenderId: "568816505263"
};
firebase.initializeApp(config);

const database = firebase.database();

let todos;
database.ref('toDoList')
  .on("value", (snapshot) => {
    todos = snapshot.val();
  }, (error) => {
    console.log('Error:' + error.code);
  });

const pushTodoDB = (newTodo) => {
  database.ref('toDoList').push().set(newTodo);
};

const todoCount = () => {
  let max = 0;
  for(let key in todos) {
    if(todos[key].id > max) {
      max = todos[key].id;
    }
  }
  return max + 1;
};

const userCount = () => {
  let max = 0;
  for(let key in usersInfo) {
    if(usersInfo[key].id > max) {
      max = usersInfo[key].id;
    }
  }
  return max + 1;
};

function addTodo({title, content, duedate, username}) {
  const newTodo = {
    id: todoCount(),
    title,
    content,
    duedate,
    username,
    complete: false
  };
  pushTodoDB(newTodo);
  return newTodo;
}

function updateTodo(key, source) {
  database.ref(`toDoList/${key}`).update({
    title: source.title,
    content: source.content,
    duedate: source.duedate
  });
  return todos[key];
}

function deleteTodo(key) {
  database.ref(`toDoList/${key}`).remove();
}

function completeTodo(key, source) {
  database.ref(`toDoList/${key}`).update({
    complete: source.complete
  });
  return todos[key];
}

/* firebase config & functions end */
/***********************************/

/* passport settings */
/*********************/
let usersInfo;
database.ref('users')
  .on("value", (snapshot) => {
    usersInfo = snapshot.val();
  }, (error) => {
    console.log("Error: " + error.code);
  });

const findById = function(id, cb) {
  process.nextTick(function() {
    for(let key in usersInfo) {
      if(usersInfo[key].id === id) {
        cb(null, usersInfo[key]);
      }
    }
  });
};

const findByUsername = function(username, cb) {
  process.nextTick(function() {
    for(let key in usersInfo) {
      if(usersInfo[key].username === username) {
        return cb(null, usersInfo[key]);
      }
    }
    return cb(null, null);
  });
};

passport.use(new Strategy(
  function(username, password, cb) {
    findByUsername(username, function(err, user) {
      if (err) { return cb(err); }
      if (!user) { return cb(null, false); }
      if (user.password != password) { return cb(null, false); }
      return cb(null, user);
    });
  }));

passport.serializeUser(function(user, cb) {
  cb(null, user.id);
});

passport.deserializeUser(function(id, cb) {
  findById(id, function (err, user) {
    if (err) { return cb(err); }
    cb(null, user);
  });
});

function usernameCheck(username) {
  let result = true;
  for(let key in usersInfo) {
    if(usersInfo[key].username === username) {
      result = false;
    }
  }
  return result;
}

function signUpRequest({username, email, password}) {
  const newUser = {
    id: userCount(),
    username: username,
    email: email,
    password: password
  };
  database.ref('users').push().set(newUser);
  return newUser;
}
/* passport settings end */
/*************************/

/* route handlers */
app.get('/api/userIsLogin', jsonMiddleware, (req, res) => {
  res.json({user: req.user});
});

app.get('/api/todos', jsonMiddleware, (req, res) => {
  res.json({todos: todos, user: req.user});
});

app.get('/api/todos/:key', jsonMiddleware, (req, res) => {
  const key = req.params.key;
  res.json(todos[key]);
});

app.put('/api/todos/:key', jsonMiddleware, (req, res) => {
  let key = req.params.key;
  const todo = updateTodo(key, req.body);
  res.send(todo);
});

app.post('/api/todos', jsonMiddleware, (req, res) => {
  const {title, content, duedate} = req.body;
  const username = req.user.username;
  if (title && content && duedate) {
    const todo = addTodo({title, content, duedate, username});
    res.send(todo);
  } else {
    res.status(400);
    res.end();
  }
});

app.patch('/api/todos/:key', jsonMiddleware, (req, res) => {
  let key = req.params.key;
  const todo = completeTodo(key, req.body);
  res.send(todo);
});

app.delete('/api/todos/:id', jsonMiddleware, (req, res) => {
  let id = req.params.id;
  deleteTodo(id);
  res.end();
});

app.post('/login', jsonMiddleware, passport.authenticate('local', { failureRedirect: '/' }), (req, res) => {
  res.json({ user: req.user });
});

app.get('/logout', (req, res) => {
  req.logout();
  res.send('logout');
});

app.post('/signup', jsonMiddleware, (req, res) => {
  const {username, email, password, password2} = req.body;
  if (usernameCheck(username)) {
    if (password === password2) {
      const todo = signUpRequest({username, email, password});
      res.send(todo);
    } else {
      res.status(400);
      res.send('비밀번호와 확인비밀번호가 일치하지 않습니다.');
    }
  } else {
    res.status(400);
    res.send(`${username} 이미 사용중인 아이디 입니다.`);
  }
  res.end();
  // signUpRequest({username, email, password});
});

app.get('/profile', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
  res.json({ user: req.user });
});

app.listen(3000, () => {
  console.log('Server Listening at http://127.0.0.1:3000');
});
