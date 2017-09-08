(function (window, document) {

  /**
   * 서버에서 할일 템플릿과 할일 데이터를 가져온 후, #todos 요소 안에 렌더링하는 함수
   */
  function loadTodos() {
    console.log('start loadTodos')
    render({
      target: '.todo-list',
      templatePath: '/templates/todos.ejs',
      dataPath: '/api/todos'
    }).then(todosEl => {

      todosEl.querySelectorAll('.todo-item').forEach(todoItem => {
        const key = todoItem.dataset.id;
        
        const updateBtn = todoItem.querySelector('.todoUpdate');
        if(updateBtn) {
          updateBtn.addEventListener('click', e => {
            axios.get(`/api/todos/${key}`)
              .then(res => {
                const inputTitle = document.querySelector('#todo-input');
                const inputContent = document.querySelector('#todo-details');
                const inputDueDate = document.querySelector('#dueDate');
                const inputBtn = document.querySelector('#inputBtn');
                inputTitle.value = res.data.title;
                inputContent.value = res.data.content.replace(/<br>/g, '\n');
                inputDueDate.value = res.data.duedate;
                inputBtn.value = "업데이트";
                
                inputBtn.addEventListener('click', e => {
                  axios.put(`/api/todos/${key}`, {
                    title: inputTitle.value,
                    content: inputContent.value.replace(/\n/g, "<br>"),
                    duedate: inputDueDate.value,
                  })
                    .then(loadTodos)
                    .then(loadComplete)
                    .then(loadInput)
                })  
            })
          })
        }

        const deleteBtn = todoItem.querySelector('.todoDelete');
        if(deleteBtn) {
          deleteBtn.addEventListener('click', e => {
            axios.delete(`/api/todos/${key}`)
              .then(loadTodos)
              .then(loadComplete)
              .then(loadInput)
          })
        }

        const completeBtn = todoItem.querySelector('.todoComplete');
        if(completeBtn) {
          completeBtn.addEventListener('click', e => {
            axios.patch(`/api/todos/${key}` , {
              complete: true
            })
              .then(loadTodos)
              .then(loadComplete)
              .then(loadInput)
          })
        }

      })
    })
  }

  function userIsLogin() {
    render({
      target: '.authComponent',
      templatePath: '/templates/authComponent.ejs',
      dataPath: '/api/userIsLogin'
    }).then(authCompEl => {
      /* authentication */
      const logInBtn = authCompEl.querySelector('.loginBtn button[type=button]');
      const logOutBtn = authCompEl.querySelector('.userInfo input[type=button]');
      const userNameField = authCompEl.querySelector('.userName input[type=text]');
      const passWordField = authCompEl.querySelector('.passWord input[type=password]');
      
      /* signup */
      const signUpModal = authCompEl.querySelector('.navSignUp button[type=button]');
      const signUpId = document.querySelector('.signUpId');
      const signUpEmail = document.querySelector('.signUpEmail');
      const signUpPw = document.querySelector('.signUpPw');
      const signUpRePw = document.querySelector('.signUpRePw');
      const signUpRequest = document.querySelector('.signUpBtn');

      if(signUpModal) {
        signUpModal.addEventListener('click', e => {
          $('#myModal').modal();
        });
      }

      if(signUpRequest) {
        signUpRequest.addEventListener('click', e => {
          axios.post('/signup', {
            username: signUpId.value,
            email: signUpEmail.value,
            password: signUpPw.value,
            password2: signUpRePw.value
          })
            .then(res => {
              signUpId.value = "";
              signUpEmail.value = "";
              signUpPw.value= "";
              signUpRePw.value = "";
              alert(`${res.data.username}님 가입을 환영합니다.`);
              $('#myModal').modal('hide');
            })
            .catch(res => {
              signUpId.value = "";
              signUpEmail.value = "";
              signUpPw.value= "";
              signUpRePw.value = "";
              alert(res.response.data);
            })
        })
      }

      if (logOutBtn) {
        logOutBtn.addEventListener('click', e => {
          axios.get('/logout')
            .then(userIsLogin)
            .then(loadInput)
            .then(loadTodos)
            .then(loadComplete)
        })
      }
      if (logInBtn) {
        logInBtn.addEventListener('click', e => {
          axios.post('/login', {
            username: userNameField.value,
            password: passWordField.value
          }).then(userIsLogin)
            .then(loadInput)
            .then(loadTodos)
            .then(loadComplete)
            .catch(res => {
              console.log(res);
            })
        })
      }
    })
  }

  function loadComplete() {
    render({
      target: '.todo-complete-list',
      templatePath: '/templates/complete.ejs',
      dataPath: '/api/todos'
    }).then(completeEl => {
      completeEl.querySelectorAll('.todo-comp-item').forEach(compItem => {
        const key = compItem.dataset.id;
        const deleteBtn = compItem.querySelector('.cdelete');
        if(deleteBtn) {
          deleteBtn.addEventListener('click', e => {
            axios.delete(`/api/todos/${key}`)
              .then(loadTodos)
              .then(loadComplete)
              .then(loadInput)
          })
        }
      })
    })
  }

  function loadInput() {
    render({
      target: '.todo-input-group',
      templatePath: '/templates/inputComponent.ejs',
      dataPath: '/api/userIsLogin'
    }).then(inputComEl => {
      const inputTitle = inputComEl.querySelector('#todo-input');
      const inputContent = inputComEl.querySelector('#todo-details');
      const inputDueDate = inputComEl.querySelector('#dueDate');
      const inputBtn = inputComEl.querySelector('#inputBtn');
      
      const setTime = setDate();
      
      if(inputDueDate) {
        inputDueDate.value = setTime.currentTime;
        inputDueDate.setAttribute('min', setTime.currentTime);
        inputDueDate.setAttribute('max', setTime.maxTime);
      }

      if(inputBtn) {
        inputBtn.addEventListener('click', e => {
          if(inputBtn.value === "계획추가") {
            axios.post('/api/todos', {
              title: inputTitle.value,
              content: inputContent.value.replace(/\n/g, "<br>"),
              duedate: inputDueDate.value,
            })
              .then(loadTodos)
              .then(loadComplete)
              .then(() => {
                inputTitle.value = "";
                inputContent.value = "";
                inputDueDate.value = setTime.currentTime;
              })
            }
        })
      }
    })
  }

  function setDate() {
    const setC = new Date();
    const year = setC.getFullYear();
    const month = setC.getMonth().toString().length === 1 ? '0' + (setC.getMonth() + 1).toString() : setC.getMonth() + 1;
    const date = setC.getDate().toString().length === 1 ? '0' + setC.getDate().toString() : setC.getDate();
    const hours = setC.getHours().toString().length === 1 ? '0' + setC.getHours().toString() : setC.getHours();
    const mins = setC.getMinutes().toString().length === 1 ? '0' + setC.getMinutes().toString() : setC.getMinutes();
    const time = {
      currentTime : year + '-' + month + '-' + date + 'T' + hours + ':' + mins,
      maxTime : (parseInt(year) + 1).toString() + '-' + month + '-' + date + 'T' + hours + ':' + mins
    };
    return time;
  };

  userIsLogin()
  loadInput()
  loadTodos()
  loadComplete()

})(window, document)
