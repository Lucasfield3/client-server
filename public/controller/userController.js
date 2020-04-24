class UserController {

    constructor(formId,formUpdateId, tableId){

        this.formEl = document.getElementById(formId);
        this.tableEl = document.getElementById(tableId);
        this.formUpdateEl = document.getElementById(formUpdateId);

        this.onSubmit();
        this.onEdit();
        this.selectAll();

    }

    onEdit(){//esse metodo edita  e salva as alterações feita em uma tr existente

        document.querySelector("#box-user-update .btn-cancel").addEventListener("click", e=>{

            this.showPanelCreate();
            event.preventDefault();

        });
        this.formUpdateEl.addEventListener("submit", event =>{

            event.preventDefault();

            let btn = this.formUpdateEl.querySelector('[type=submit]');

            btn.disabled = true;

            let values = this.getValues(this.formUpdateEl);

            let index = this.formUpdateEl.dataset.trIndex;

            let tr = this.tableEl.rows[index];

            let userOld = JSON.parse(tr.dataset.user);

            let result = Object.assign({}, userOld, values);

            this.getPhoto(this.formUpdateEl).then(
                
                (content) => {

                        if(!values.photo) {
                            result._photo = userOld._photo;
                        }else {
                            result._photo = content;
                        }

                    let user = new User();

                    user.loadFromJSON(result);

                    user.save();

                    this.getTr(user, tr);

                    this.updateCount();

                    this.formUpdateEl.reset();

                    btn.disabled = false;

                    this.showPanelCreate();
                     btn.disabled = false;

                    },
                    (e) => {

                        console.error(e);

                }
            );

        });


    }

    onSubmit(){

        this.formEl.addEventListener("submit", event =>{

            let btn = this.formEl.querySelector('[type=submit]');

            btn.disabled = true;
    
            event.preventDefault();

            let values = this.getValues(this.formEl);

            if (!values) return false;

            this.getPhoto(this.formEl).then(
                
                (content) => {

                    values.photo = content;

                    values.save();

                    this.addLine(values);

                    this.formEl.reset();

                    btn.disabled = false;

                },
                (e) => {

                    console.error(e);

                }
            );
        
        });

    }


    getPhoto(formEl){

        return new Promise((resolve, reject) => {

            let fileReader = new FileReader()

            let elements =  [...formEl.elements].filter(item => {

           if (item.name ==="photo"){

            return item;

           }

        });

        let file = elements[0].files[0];

        fileReader.onload = () =>{

            resolve(fileReader.result)

        }
        fileReader.onerror = (e)=>{

            reject(e);

        };
        
        if (file){

            fileReader.readAsDataURL(file);

        }else {

            resolve('dist/img/boxed-bg.jpg');

        }
        

        });

        

    }

    getValues(formEl){//esse metodo atribui valores que foram inserido pelo usuario e retorna um novo usuario

        let user = {};
        let isValid = true;

        [...formEl.elements].forEach(function(field, index){

            if(['name', 'email', 'password'].indexOf(field.name) > -1 && !field.value){

                field.parentElement.classList.add("has-error");

                isValid = false;

            }

            if(field.name == "gender"){
        
                if(field.checked){
        
                    user[field.name] = field.value;
                }

            }else if (field.name == 'admin'){

                user[field.name] = field.checked;

            }else {

                user[field.name] = field.value;
            }
        
            
        });

        if (!isValid){

            return false;

        }
        
        return new User(
            user.name,
            user.gender,
            user.email,
            user.birth,
            user.country,
            user.password,
            user.photo,
            user.admin,
            user.register
        );

    }

    //Metodo para percorrer o storage do site quando ele é iniciado
    selectAll(){

        let users =  User.getUserStorage();

        users.forEach(dataUser =>{

            let user = new User();

            user.loadFromJSON(dataUser);

            this.addLine(user);

        });

    }

    //View do codigo, parte visual que o usuario terá acesso
    addLine(dataUser){//ele adiciona uma nova tr na tabela 

        let tr =  this.getTr(dataUser);
        

    
        this.tableEl.appendChild(tr);

        this.updateCount();
    }

    getTr(dataUser, tr = null){//esse metodo seleciona uma tr 

        if(tr === null) tr = document.createElement('tr');

        tr.dataset.user = JSON.stringify(dataUser);//dataset tranforma o objeto em string, é usado para codificar melhor, 

        tr.innerHTML = `
            <tr>
                <td><img src="${dataUser.photo}" alt="User Image" class="img-circle img-sm"></td>
                <td>${dataUser.name}</td>
                <td>${dataUser.email}</td>
                <td>${(dataUser.admin) ? 'Sim' : 'Não'}</td>
                <td>${Utils.dateFormat(dataUser.register)}</td>
                <td>
                    <button type="button" class="btn btn-primary btn-edit btn-xs btn-flat">Editar</button>
                    <button type="button" class="btn btn-danger  btn-delete btn-xs btn-flat">Excluir</button>
                </td>
            </tr>
         `;

         this.addEventsTR(tr);

         return tr;

    }

    addEventsTR(tr){//esse metodos adiciona eventos nos botoes de uma tr

        tr.querySelector(".btn-delete").addEventListener('click', e =>{

            if(confirm("Deseja realmente excluir?")){

                let user = new User();

                user.loadFromJSON(JSON.parse(tr.dataset.user));

                user.remove();

                tr.remove();

                this.updateCount();

            }

        });

        tr.querySelector(".btn-edit").addEventListener('click', e =>{

            let json = JSON.parse(tr.dataset.user);


            this.formUpdateEl.dataset.trIndex = tr.sectionRowIndex;

            for (let name in json){

               let field = this.formUpdateEl.querySelector("[name = "+ name.replace("_", "")+ "]");

               

               if (field){

                switch (field.type){
                    case 'file':
                        continue;    
                    break;
                    case 'radio':
                            field =  this.formUpdateEl.querySelector("[name = " + name.replace("_", "") + "][value = " + json[name] + "]");
                            field.checked = true;
                    break;
                    case 'checkbox':
                        field.checked = json[name]; 
                    break;

                    default:
                        field.value = json[name];
                }
               }
            }

            this.formUpdateEl.querySelector('.photo').src = json._photo;
            this.showPanelUpdate();

         });

    }

    showPanelCreate(){//esse metodo mostra o painel de criação de usuário e esconde o painel de edição

        document.querySelector("#box-user-create").style.display = "block";
        document.querySelector("#box-user-update").style.display = "none";

    }

    showPanelUpdate(){//o oposto do metodo acima

        document.querySelector("#box-user-create").style.display = "none";
        document.querySelector("#box-user-update").style.display = "block";

    }

    updateCount(){//esse metodo atualiza a contagem de usuarios adm e usuarios sem adm ao decorrer da criação  das trs

        let numberUser = 0;
        let numberAdmin = 0;

        [...this.tableEl.children].forEach(tr =>{

            numberUser++;

            let user = JSON.parse(tr.dataset.user);//o data set esta sendo tranformado de volta na forma anterior que era um objeto, assim dessa forma o codigo n tera tantos problemas na view

            if(user._admin) numberAdmin++;

        });
        
        document.querySelector("#number-user").innerHTML = numberUser;
        document.querySelector("#number-user-admin").innerHTML = numberAdmin;
    }
    
}