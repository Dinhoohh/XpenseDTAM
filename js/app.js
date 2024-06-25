// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
  getAuth, 
  signOut, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { 
  getFirestore,
  collection, 
  doc, 
  setDoc,
  addDoc,
  getDoc,
  getDocs,
  query,
  where,
  Timestamp, 
  deleteDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"; 
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBQKPkjCMkxLYddDPmIsiZ4PVDejRy4tYo",
  authDomain: "projeto-22416.firebaseapp.com",
  projectId: "projeto-22416",
  storageBucket: "projeto-22416.appspot.com",
  messagingSenderId: "762698713931",
  appId: "1:762698713931:web:ba3d6a8e91fec996a0b6ce",
  measurementId: "G-5SLCVGE1ZQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

let currentUserID = null;

onAuthStateChanged(auth, async (user) => {
  const spinner = document.getElementById('spinner');
  
  if (user) {
    currentUserID = user.uid;
    console.log("User logged:", currentUserID);

    try {
      const userDoc = await getDoc(doc(db, "users", currentUserID));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.role === 'admin') {
          console.log("Admin");
          const adminLink = document.getElementById('admin-link');
          displayUserData(currentUserID)
          await displayUserData(currentUserID);
          await displayUserGoals(currentUserID);
          await updateTransactionCount(currentUserID);
          await updateEntriesCount(currentUserID);
          await displayUserBudget(currentUserID);
          await displayUserSubscriptions(currentUserID); 
          if (adminLink) {
            adminLink.style.display = 'block';
          }
          await displayAllUsers();
        } else {
          const adminLink = document.getElementById('admin-link');
          if (adminLink) {
            adminLink.style.display = 'none';
          }
          await displayUserData(currentUserID);
          await displayUserGoals(currentUserID);
          await updateTransactionCount(currentUserID);
          await updateEntriesCount(currentUserID);
          await displayUserBudget(currentUserID);
          await displayUserSubscriptions(currentUserID); 
        }
      } else {
        console.error("User document not found.");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      spinner.style.display = 'none';
    }
  } else {
    console.log("No user signed in.");
    const adminLink = document.getElementById('admin-link');
    if (adminLink) {
      adminLink.style.display = 'none';
    }
    spinner.style.display = 'none';
  }
});

async function createOrUpdateUser(userId, email, nome, saldoMensal, saldoTotal, fotoPerfil, role = 'user') {
  try {
    await setDoc(doc(db, "users", userId), {
      email: email,
      nome: nome,
      saldoMensal: saldoMensal,
      saldoTotal: saldoTotal,
      fotoPerfil: fotoPerfil,
      role: role
    });
    console.log("User document created/updated successfully");
  } catch (error) {
    console.error("Error creating/updating user document:", error);
  }
}

async function addExpense(userId, categoria, valor, data, nome) {
  await addDoc(collection(db, "despesas"), {
    userId: userId,
    categoria: categoria,
    valor: valor,
    data: data,
    nome: nome
  });
  await updateUserSaldo(userId, valor, true);
}

async function addIncome(userId, categoria, valor, data, nome) {
  await addDoc(collection(db, "entradas"), {
    userId: userId,
    categoria: categoria,
    valor: valor,
    data: data,
    nome: nome
  });
  await updateUserSaldo(userId, valor, false);
}

async function budgetDef(userId, valor) {
  await addDoc(collection(db, "budget"), {
    userId: userId,
    valor: valor
  });
}

async function addSubscription(userId, nome, valor, dataPagamento, imagem) {
  await addDoc(collection(db, "subscriptions"), {
    userId: userId,
    nome: nome,
    valor: valor,
    dataPagamento: dataPagamento,
    imagem: imagem
  });
}

async function addGoal(userId, nome, valorObjetivo, valorAtual, imagem) {
  await addDoc(collection(db, "objetivos"), {
    userId: userId,
    nome: nome,
    valorObjetivo: valorObjetivo,
    valorAtual: valorAtual,
    imagem: imagem
  });
}

async function getUserData(userId) {
  const userRef = doc(db, "users", userId);
  try {
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      console.log("User document exists:", userDoc.data());
      return { id: userDoc.id, ...userDoc.data() };
    } else {
      console.error("No such document!");
      return null;
    }
  } catch (error) {
    console.error("Error fetching user data:", error);
    return null;
  }
}

async function getUserExpenses(userId) {
  const q = query(collection(db, "despesas"), where("userId", "==", userId));
  const querySnapshot = await getDocs(q);
  const expenses = [];
  querySnapshot.forEach((doc) => {
    expenses.push({ id: doc.id, ...doc.data() });
  });
  return expenses;
}

async function updateTransactionCount(userId) {
  const expenses = await getUserExpenses(userId);
  const transactionCount = expenses.length;

  const movimentosElement = document.getElementById('movimentos');
  if (movimentosElement) {
    movimentosElement.textContent = transactionCount.toString();
  } else {
  }
}

async function updateEntriesCount(userId) {
  const entries = await getUserEntries(userId);
  const transactionCount = entries.length;

  const movimentosElement = document.getElementById('movEntries');
  if (movimentosElement) {
    movimentosElement.textContent = transactionCount.toString();
  } else {
  }
}

async function getUserEntries(userId) {
  const q = query(collection(db, "entradas"), where("userId", "==", userId));
  const querySnapshot = await getDocs(q);
  const entries = [];
  querySnapshot.forEach((doc) => {
    entries.push({ id: doc.id, ...doc.data() });
  });
  return entries;
}

async function getUserBudget(userId) {
  try {
    const q = query(collection(db, 'budget'), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    const budgets = [];
    querySnapshot.forEach((doc) => {
      budgets.push({ id: doc.id, ...doc.data() });
    });
    return budgets;
  } catch (error) {
    console.error("Error fetching user budget:", error);
    return [];
  }
}

async function getUserSubscriptions(userId) {
  try {
    const q = query(collection(db, "subscriptions"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    const subscriptions = [];
    querySnapshot.forEach((doc) => {
      subscriptions.push({ id: doc.id, ...doc.data() });
    });
    return subscriptions;
  } catch (error) {
  }
}

async function getUserGoals(userId) {
  const q = query(collection(db, "objetivos"), where("userId", "==", userId));
  const querySnapshot = await getDocs(q);
  const goals = [];
  querySnapshot.forEach((doc) => {
    goals.push({ id: doc.id, ...doc.data() });
  });
  return goals;
}

//saldo
async function updateUserSaldo(userId, valor, isExpense = true) {
  const userRef = doc(db, "users", userId);
  const userDoc = await getDoc(userRef);

  if (userDoc.exists()) {
    const userData = userDoc.data();
    const newSaldoTotal = isExpense ? userData.saldoTotal - valor : userData.saldoTotal + valor;

    await setDoc(userRef, {
      saldoTotal: newSaldoTotal
    }, { merge: true });
  }
}

//dados
async function displayUserData(userId) {
  const userData = await getUserData(userId);

  if (!userData) {
    console.error("User data is null or not found.");
    return;
  }

  const userNameElement = document.getElementById('user-name');
  if (userNameElement) {
    userNameElement.textContent = userData.nome || "Nome não disponível";
  } else {
  }

  const userEmailElement = document.getElementById('user-email');
  if (userEmailElement) {
    userEmailElement.textContent = userData.email || "Email não disponível";
  } else {
  }

  const userProfilePicElement = document.getElementById('user-profile-pic');
  if (userProfilePicElement) {
    userProfilePicElement.src = userData.fotoPerfil || 'default-image-url.jpg';
  } else {
  }
  
  const monthlyBalance = await calculateMonthlyBalance(userId);
  const monthlyBalanceElement = document.getElementById('monthly-balance');
  if (monthlyBalanceElement) {
    monthlyBalanceElement.textContent = `€ ${monthlyBalance.toFixed(2)}`;
  } else {
  }

  const totalBalance = await calculateTotalBalance(userId);
  const totalBalanceElement = document.getElementById('total-balance');
  if (totalBalanceElement) {
    totalBalanceElement.textContent = `€ ${totalBalance.toFixed(2)}`;
  } else {
  }
}

//saldo mensal
async function calculateMonthlyBalance(userId) {
  try {
    const expensesQuery = query(collection(db, "despesas"), where("userId", "==", userId));
    const expensesSnapshot = await getDocs(expensesQuery);

    let totalExpenses = 0;
    expensesSnapshot.forEach((doc) => {
      totalExpenses += doc.data().valor;
    });

    const budgets = await getUserBudget(userId); 
    const totalBudget = budgets.length > 0 ? budgets[0].valor : 0;

    const monthlyBalance = totalBudget - totalExpenses;

    return monthlyBalance;
  } catch (error) {
    console.error("Erro ao calcular o saldo mensal:", error);
    return null;
  }
}

//saldo total
async function calculateTotalBalance(userId) {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (!userDoc.exists()) {
      console.error("User not found");
      return null;
    }
    const initialBalance = userDoc.data().saldoTotal || 0;

    const expensesQuery = query(collection(db, "despesas"), where("userId", "==", userId));
    const expensesSnapshot = await getDocs(expensesQuery);
    let totalExpenses = 0;
    expensesSnapshot.forEach((doc) => {
      totalExpenses += doc.data().valor;
    });

    const incomeQuery = query(collection(db, "entradas"), where("userId", "==", userId));
    const incomeSnapshot = await getDocs(incomeQuery);
    let totalIncome = 0;
    incomeSnapshot.forEach((doc) => {
      totalIncome += doc.data().valor;
    });

    const totalBalance = initialBalance + totalIncome - totalExpenses;

    return totalBalance;
  } catch (error) {
    console.error("Error calculating saldo total:", error);
    return null;
  }
}

//admin recursos
async function displayAllUsers() {
  const usersListElement = document.getElementById('users-list');
  try {
    const usersQuery = query(collection(db, "users"));
    const querySnapshot = await getDocs(usersQuery);
    let userItemsHtml = '<div class="row">';

    querySnapshot.forEach((doc, index) => {
      const userData = doc.data();
      const userItemHtml = `
        <div class="grey-background align-items-center m-between">
          <div class="user-item">
            <img src="${userData.fotoPerfil || 'default-image-url.jpg'}" alt="${userData.nome}">
            <p class="email">${userData.email} - ${userData.role}</p>
            <h3>${userData.nome}</h3>
            <p>Saldo Mensal: €${userData.saldoMensal.toFixed(2)}</p>
            <p>Saldo Total: €${userData.saldoTotal.toFixed(2)}</p>
            <button class="delete-user-button" data-user-id="${doc.id}">Eliminar utilizador</button>
          </div>
        </div>
      `;
      userItemsHtml += userItemHtml;

      if ((index + 1) % 2 === 0) {
        userItemsHtml += '</div><div class="row">';
      }
    });

    if (querySnapshot.size % 2 !== 0) {
      userItemsHtml += '</div>';
    }

    usersListElement.innerHTML = userItemsHtml;

    const deleteButtons = document.querySelectorAll('.delete-user-button');
    deleteButtons.forEach(button => {
      button.addEventListener('click', async (event) => {
        const userId = event.target.getAttribute('data-user-id');
        await handleDeleteUser(userId);
      });
    });
  } catch (error) {
    console.error("Error fetching users:", error);
  }
}

async function handleDeleteUser(userId) {
  const confirmDelete = window.confirm("Eliminar este utilizador?");

  if (confirmDelete) {
    try {
      await deleteDoc(doc(db, 'users', userId));
      console.log('User deleted successfully');
      displayAllUsers(); 
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  } else {
    console.log('User deletion canceled');
  }
}

//despesas
if (window.location.pathname === '/html/gerir.html' || window.location.pathname === '/html/home.html') {
  document.addEventListener('DOMContentLoaded', async () => {
    const expenseList = document.getElementById('expense-list');
    const totalExpensesElement = document.getElementById("total-expenses");

    try {
      await new Promise((resolve) => {
        const checkUserId = setInterval(() => {
          if (currentUserID) {
            clearInterval(checkUserId);
            resolve();
          }
        }, 100);
      });

      if (window.location.pathname === '/html/gerir.html') {
        const saidasButton = document.getElementById('saidas');
        const entradasButton = document.getElementById('entradas');
    
        saidasButton.addEventListener('click', () => {
          saidasButton.classList.add('selected');
          entradasButton.classList.remove('selected');
          window.location.href = "/html/gerir.html";
        });
    
        entradasButton.addEventListener('click', () => {
          entradasButton.classList.add('selected');
          saidasButton.classList.remove('selected');
          window.location.href = "/html/gerir-2.html";
        });
      }
    
      const expenses = await getUserExpenses(currentUserID);
      expenses.sort((a, b) => new Date(b.data) - new Date(a.data));
      const displayExpenses = (window.location.pathname.includes('/html/home.html')) ? expenses.slice(0, 2) : expenses;
  
      displayExpenses.forEach(expense => {
        const expenseItem = document.createElement('div');
        expenseItem.classList.add('expense-item');
  
        if (window.location.pathname === '/html/gerir.html') {
          const dateP = document.createElement('p');
          dateP.classList.add('date');
          dateP.textContent = convertDateFormat(expense.data);
          expenseItem.appendChild(dateP);
        }
  
        const rowDiv = document.createElement('div');
        rowDiv.classList.add('row');
  
        const col2Div = document.createElement('div');
        col2Div.classList.add('col-2');
        const categoryCircle = document.createElement('div');
        categoryCircle.classList.add('category-circle');
        categoryCircle.style.backgroundColor = getCategoryColor(expense.categoria);
        categoryCircle.style.borderRadius = '100px';
        categoryCircle.style.width = '40px';
        categoryCircle.style.height = '40px';
        
        col2Div.appendChild(categoryCircle);
        rowDiv.appendChild(col2Div);
  
        const col8Div = document.createElement('div');
        col8Div.classList.add('col-8');
        const h5 = document.createElement('h5');
        h5.classList.add('h-mov');
        h5.textContent = expense.nome;
        const p = document.createElement('p');
        p.classList.add('p-mov');
        p.textContent = expense.categoria;
        col8Div.appendChild(h5);
        col8Div.appendChild(p);
        rowDiv.appendChild(col8Div);
  
        const col2ValueDiv = document.createElement('div');
        col2ValueDiv.classList.add('col-2', 'text-end');
        col2ValueDiv.textContent = `-${expense.valor}€`;
        rowDiv.appendChild(col2ValueDiv);
  
        expenseItem.appendChild(rowDiv);
        expenseList.appendChild(expenseItem);
      });
  
      let totalExpenses = 0;
      expenses.forEach(expense => {
        totalExpenses += expense.valor;
      });

      if (totalExpensesElement) {
        totalExpensesElement.textContent = `€${totalExpenses.toFixed(2)}`;
      } else {
        console.error('Element "total-expenses" not found.');
      }

      const myChart = document.getElementById("myChart");
      if (myChart) {
        const chartData = prepareChartData(expenses);
        renderChart(myChart, chartData);
      } else {
        console.error('myChart not found.');
      }
    } catch (error) {
      console.error("Error displaying expenses:", error);
    }
  });  
}   

//chart
function prepareChartData(expenses) {
  const categories = {};
  expenses.forEach(expense => {
    if (categories[expense.categoria]) {
      categories[expense.categoria] += expense.valor;
    } else {
      categories[expense.categoria] = expense.valor;
    }
  });

  const chartData = {
    data: Object.values(categories),
    labels: Object.keys(categories),
    backgroundColor: Object.keys(categories).map(category => getCategoryColor(category))
  };

  return chartData;
}

function getCategoryColor(category) {
  const colors = {
    "Habitação": "#FF7A00",
    "Saúde": "#FF0000",
    "Lazer": "#FF00FF",
    "Comida": "#FFFF00",
    "Compras": "#00FF00",
    "Educação": "#0000FF",
    "Fitness": "#00FFFF",
    "Outros": "#800080"
  };
  return colors[category];
}

function renderChart(chartElement, chartData) {
  new Chart(chartElement, {
    type: "doughnut",
    data: {
      labels: chartData.labels,
      datasets: [{
        data: chartData.data,
        backgroundColor: chartData.backgroundColor
      }],
    },
    options: {
      borderWidth: 0,
      borderRadius: 0,
      hoverBorderWidth: 0,
      cutout: '85%',
      plugins: {
        legend: { display: false },
      },
    },
  });
}



//login
document.addEventListener('DOMContentLoaded', () => {
  const loginButton = document.getElementById('login');
  if (loginButton) {
    loginButton.addEventListener('click', async () => {
      const emailField = document.getElementById('email');
      const passwordField = document.getElementById('password');
      const email = emailField.value;
      const password = passwordField.value;
      
      emailField.classList.remove('error');
      passwordField.classList.remove('error');
      
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.role === 'admin') {
            window.location.href = "/html/account.html";
          } else {
            window.location.href = "/html/home.html";
          }
        }
      } catch (error) {
        console.error("Error signing in:", error.message);
        alert("As credenciais não correspondem! Tente novamente.")
        emailField.classList.add('error');
        passwordField.classList.add('error');
      }
    });
  }
});

//logout
if (window.location.pathname === '/html/account.html') {
  document.addEventListener('DOMContentLoaded', () => {
    const logoutButton = document.getElementById('logout');
    if (logoutButton) {
      logoutButton.addEventListener('click', async () => {
        try {
          await signOut(auth);
          localStorage.removeItem('userData');
          alert("Logout feito!");
          window.location.href = "/html/index.html";
        } catch (error) {
          console.error(error);
          alert("Erro ao dar log out. Tenta outra vez!");
        }
      });
    }
  });
}

//signup
async function createAccount(email, password, name, profilePic, role = 'user') {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    const userId = user.uid;

    const storageRef = ref(storage, `profile_pics/${userId}`);
    const snapshot = await uploadBytes(storageRef, profilePic);
    const profilePicUrl = await getDownloadURL(snapshot.ref);

    await createOrUpdateUser(userId, email, name, 0, 0, profilePicUrl, role);
    
    alert("Conta criada com sucesso!");
    window.location.href = "/html/home.html";
    
    return user;
  } catch (error) {
    console.error("Error creating account:", error);
    throw error;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const signupButton = document.getElementById('signup');
  if (signupButton) {
      signupButton.addEventListener('click', async () => {
          const emailField = document.getElementById('email');
          const passwordField = document.getElementById('password');
          const nameField = document.getElementById('name');
          const profilePicField = document.getElementById('profile-pic');
          const email = emailField.value;
          const password = passwordField.value;
          const name = nameField.value;
          const profilePic = profilePicField.files[0];

          emailField.classList.remove('error');
          passwordField.classList.remove('error');
          nameField.classList.remove('error');
          profilePicField.classList.remove('error');

          try {
              const user = await createAccount(email, password, name, profilePic);
              window.location.href = "/html/home.html";
          } catch (error) {
              console.error("Error creating account:", error.message);
              emailField.classList.add('error');
              passwordField.classList.add('error');
              nameField.classList.add('error');
              profilePicField.classList.add('error');
              alert("Erro ao criar conta. Por favor, tenta novamente.");
          }
      });
  }
});

//adicionar despesa
if (window.location.pathname.includes('/html/add-expense.html')) {
  document.addEventListener('DOMContentLoaded', () => {
    const iconInputs = document.querySelectorAll('.icon-input input[type="radio"]');
    iconInputs.forEach(input => {
      input.addEventListener('change', (event) => {
        console.log('Selected category:', event.target.value);
      });
    });
    document.getElementById('adicionarBtn').addEventListener('click', async () => {
      const categoria = document.querySelector('input[name="category"]:checked')?.value;
      const valor = parseFloat(document.getElementById('valor').value);
      const data = document.getElementById('data').value;
      const nome = document.getElementById('nome').value;
  
      if (!categoria) {
        alert("Por favor, selecione uma categoria.");
        return;
      }
      if (isNaN(valor) || valor <= 0) {
        alert("Por favor, insira um valor válido.");
        return;
      }
      try {
        if (currentUserID) {
          await addExpense(currentUserID, categoria, valor, data, nome);
          alert("Despesa adicionada com sucesso!");
          window.location.href = "/html/gerir.html";
        } else {
          console.error("LOGGGGG INNNN");
          alert("Erro ao adicionar despesa. Por favor entre na tua cotna.");
          window.location.href = "/html/index.html";
        }
      } catch (error) {
        console.error(error);
        alert("Erro ao adicionar despesa. Tenta novamente.");
      }
    });
  });
}

//definir saldo
if (window.location.pathname === '/html/changebalance.html') {
  document.addEventListener('DOMContentLoaded', () => {
    const updateSaldoBtn = document.getElementById('update-saldo-btn');
    const saldoTotalInput = document.getElementById('saldo-total-input');

    updateSaldoBtn.addEventListener('click', async () => {
      const newSaldoTotal = parseFloat(saldoTotalInput.value);

      if (isNaN(newSaldoTotal) || newSaldoTotal < 0) {
        alert("Por favor insere um número positivo para definir o saldo total.");
        return;
      }

      try {
        if (currentUserID) {
          await setDoc(doc(db, "users", currentUserID), {
            saldoTotal: newSaldoTotal
          }, { merge: true });

          const saldoTotalElement = document.getElementById('user-saldo-total');
          if (saldoTotalElement) {
            saldoTotalElement.textContent = `Saldo Total: € ${newSaldoTotal.toFixed(2)}`;
          }

          alert("Saldo total atualizado!");
          window.location.href = "/html/home.html"
        } else {
          console.error("No user is logged in.");
          alert("No user is currently logged in.");
        }
      } catch (error) {
        console.error("Error updating saldo total:", error);
      }
    });
  });
}

//poupanças
async function displayUserGoals(currentUserID) {
  console.log("Current Path:", window.location.pathname);
  const goalsContainer = document.getElementById('goals-container');

  if (!goalsContainer) {
    return;
  }
  
  try {
    const goals = await getUserGoals(currentUserID);

    if (window.location.pathname === '/html/home.html') {
      const firstGoal = goals[0];

      if (firstGoal) {
        const goalHtml = `
          <h1 style="margin-top: 40px; margin-bottom: 40px" class="headers">Poupanças</h1>
          <div class="col">
            <div class="card mb-3">
              <img src="${firstGoal.imagem || 'default-image-url.jpg'}" class="card-img-top" alt="...">
              <div class="card-body">
                <div class="row">
                  <h5 class="card-title">${firstGoal.nome}</h5>
                </div>
                 <div class="row">
                <div class="col-6">
                  <p class="card-value jutify-content-left">Valor atual: <span class="green">${firstGoal.valorAtual}€</span></p>
                </div>
                <div class="col-6">
                  <p class="card-value" style="text-align: end;">Valor do objetivo: <span class="green">${firstGoal.valorObjetivo}€</span></p>
                </div>
                </div>
              </div>
            </div>
          </div>
          <div class="row">
                    <h5 style="margin-bottom: 100px; text-align: center; margin-top: 20px;" class="card-title">Está quase pronto para partir o mealheiro!</h5>
          </div>
        `;
        
        goalsContainer.innerHTML = goalHtml;
      } else {
        goalsContainer.innerHTML = '<p style="text-align: center;">Adiciona objetivos</p>';
      }
    } else if (window.location.pathname === '/html/savings.html') {
      let goalsHtml = '';

      goals.forEach(goal => {
        const goalHtml = `
          <div class="col-12">
            <div class="card mb-3">
              <img src="${goal.imagem || 'default-image-url.jpg'}" class="card-img-top" alt="...">
              <div class="card-body">
                <div class="row">
                  <h5 class="card-title">${goal.nome}</h5>
                </div>
                 <div class="row">
                <div class="col-6">
                  <p class="card-value jutify-content-left">Valor atual: <span class="green">${goal.valorAtual}€</span></p>
                </div>
                <div class="col-6">
                  <p class="card-value" style="text-align: end;">Valor do objetivo: <span class="green">${goal.valorObjetivo}€</span></p>
                </div>
                </div>
              </div>
            </div>
          </div>
        `;
        goalsHtml += goalHtml;
      });

      goalsContainer.innerHTML = goalsHtml;
    } else {
      goalsContainer.innerHTML = '<p>Page not supported.</p>';
    }
  } catch (error) {
    console.error("Error fetching user goals:", error);
    goalsContainer.innerHTML = '<p>Error fetching goals.</p>'; 
  }
}


//adicionar poupanças/objet
if (window.location.pathname === '/html/addsavings.html') {
document.addEventListener('DOMContentLoaded', () => {
  const addGoalForm = document.getElementById('add-goal-form');
  addGoalForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const goalName = document.getElementById('goal-name').value;
    const goalTarget = parseFloat(document.getElementById('goal-target').value);
    const goalCurrent = parseFloat(document.getElementById('goal-current').value);
    const goalImage = document.getElementById('goal-image').files[0];

    try {
      if (currentUserID) {
        let imageUrl = '';

        if (goalImage) {
          const storageRef = ref(storage, `goal_images/${currentUserID}/${goalImage.name}`);
          const snapshot = await uploadBytes(storageRef, goalImage);
          imageUrl = await getDownloadURL(snapshot.ref);
        }

        await addGoal(currentUserID, goalName, goalTarget, goalCurrent, imageUrl);
        alert("Objetivo adicionado com sucesso!");
        window.location.href = "/html/savings.html";
      } else {
        console.error("No user is logged in.");
        alert("Nenhum utilizador logged in.");
      }
    } catch (error) {
      console.error("Error adding goal:", error);
      alert("Erro ao adicionar objetivo. Tenta novamente.");
    }
  });
});
}

//subscriptions
if (window.location.pathname === '/html/add-subscription.html') {
document.addEventListener('DOMContentLoaded', () => {
  const addSubscriptionForm = document.getElementById('add-subscription-form');
  addSubscriptionForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const subscriptionValue = parseFloat(document.getElementById('subscription-value').value.replace('.', ','));
    const subscriptionName = document.getElementById('subscription-name').value;
    const subscriptionDate = document.getElementById('subscription-payment-date').value;
    const subscriptionImage = document.getElementById('subscription-image').files[0];

    try {
      if (currentUserID) {
        let imageUrl = '';

        if (subscriptionImage) {
          const storageRef = ref(storage, `goal_images/${currentUserID}/${subscriptionImage.name}`);
          const snapshot = await uploadBytes(storageRef, subscriptionImage);
          imageUrl = await getDownloadURL(snapshot.ref);
        }

        await addSubscription(currentUserID, subscriptionName, subscriptionValue, subscriptionDate, imageUrl);
        alert("Subscrição adicionada com sucesso!");
        window.location.href = "/html/subscriptions.html";
      } else {
        console.error("No user is logged in.");
        alert("Nenhum utilizador logado.");
      }
    } catch (error) {
      console.error("Error adding subscription:", error);
      alert("Erro ao adicionar subscrição. Tente novamente.");
    }
  });
});
}

//adicionar entrada
if (window.location.pathname.includes('/html/add-income.html')) {
  document.addEventListener('DOMContentLoaded', () => {
    const iconInputs = document.querySelectorAll('.icon-input input[type="radio"]');
    iconInputs.forEach(input => {
      input.addEventListener('change', (event) => {
        console.log('Selected category:', event.target.value);
      });
    });
    document.getElementById('adicionarBtn').addEventListener('click', async () => {
      const categoria = document.querySelector('input[name="category"]:checked')?.value;
      const valor = parseFloat(document.getElementById('valor').value);
      const data = document.getElementById('data').value;
      const nome = document.getElementById('nome').value;
  
      if (!categoria) {
        alert("Por favor, selecione uma categoria.");
        return;
      }
      if (isNaN(valor) || valor <= 0) {
        alert("Por favor, insira um valor válido.");
        return;
      }
      try {
        if (currentUserID) {
          await addIncome(currentUserID, categoria, valor, data, nome);
          alert("Despesa adicionada com sucesso!");
          window.location.href = "/html/gerir-2.html";
        } else {
          console.error("LOGGGGG INNNN");
          alert("Erro ao adicionar despesa. Por favor entre na tua cotna.");
          window.location.href = "/html/index.html";
        }
      } catch (error) {
        console.error(error);
        alert("Erro ao adicionar despesa. Tenta novamente.");
      }
    });
  });
}


// entradas
if (window.location.pathname === '/html/gerir-2.html') {
  document.addEventListener('DOMContentLoaded', async () => {
    const incomeList = document.getElementById('income-list');
    const totalIncomeElement = document.getElementById("total-income");

    try {
      await new Promise((resolve) => {
        const checkUserId = setInterval(() => {
          if (currentUserID) {
            clearInterval(checkUserId);
            resolve();
          }
        }, 100);
      });

      if (window.location.pathname === '/html/gerir-2.html') {
        const saidasButton = document.getElementById('saidas');
        const entradasButton = document.getElementById('entradas');
    
          saidasButton.addEventListener('click', () => {
            saidasButton.classList.remove('selected');
            entradasButton.classList.add('selected');
            window.location.href = "/html/gerir.html";
          });
    
          entradasButton.addEventListener('click', () => {
            entradasButton.classList.add('selected');
            saidasButton.classList.remove('selected');
            window.location.href = "/html/gerir-2.html";
          });
        };
    
      const income = await getUserEntries(currentUserID);
      income.sort((a, b) => new Date(b.data) - new Date(a.data));
      const displayIncome = income;
  
      displayIncome.forEach(entries => {
        const entriesItem = document.createElement('div');
        entriesItem.classList.add('entries-item');
  
        if (window.location.pathname === '/html/gerir-2.html') {
          const dateP = document.createElement('p');
          dateP.classList.add('date');
          dateP.textContent = convertDateFormat(entries.data);
          entriesItem.appendChild(dateP);
        }
  
        const rowDiv = document.createElement('div');
        rowDiv.classList.add('row');
  
        const col2Div = document.createElement('div');
        col2Div.classList.add('col-2');
        const categoryCircle = document.createElement('div');
        categoryCircle.classList.add('category-circle');
        categoryCircle.style.backgroundColor = getCategoryColorEntries(entries.categoria);
        categoryCircle.style.borderRadius = '100px';
        categoryCircle.style.width = '40px';
        categoryCircle.style.height = '40px';
        
        col2Div.appendChild(categoryCircle);
        rowDiv.appendChild(col2Div);
  
        const col8Div = document.createElement('div');
        col8Div.classList.add('col-8');
        const h5 = document.createElement('h5');
        h5.classList.add('h-mov');
        h5.textContent = entries.nome;
        const p = document.createElement('p');
        p.classList.add('p-mov');
        p.textContent = entries.categoria;
        col8Div.appendChild(h5);
        col8Div.appendChild(p);
        rowDiv.appendChild(col8Div);
  
        const col2ValueDiv = document.createElement('div');
        col2ValueDiv.classList.add('col-2', 'text-end');
        col2ValueDiv.textContent = `+${entries.valor}€`;
        rowDiv.appendChild(col2ValueDiv);
  
        entriesItem.appendChild(rowDiv);
        incomeList.appendChild(entriesItem);
      });
  
      let totalincome = 0;
      income.forEach(entries => {
        totalincome += entries.valor;
      });

      if (totalIncomeElement) {
        totalIncomeElement.textContent = `€${totalincome.toFixed(2)}`;
      } else {
        console.error('Element "total-income" not found.');
      }

      const myChart = document.getElementById("myChart");
      if (myChart) {
        const chartData = prepareChartDataEntries(income);
        renderChartEntries(myChart, chartData);
      } else {
        console.error('myChart not found.');
      }
    } catch (error) {
      console.error("Error displaying income:", error);
    }
  });  
}
//chart
function prepareChartDataEntries(income) {
  const categories = {};
  income.forEach(entries => {
    if (categories[entries.categoria]) {
      categories[entries.categoria] += entries.valor;
    } else {
      categories[entries.categoria] = entries.valor;
    }
  });

  const chartData = {
    data: Object.values(categories),
    labels: Object.keys(categories),
    backgroundColor: Object.keys(categories).map(category => getCategoryColorEntries(category))
  };

  return chartData;
}

function getCategoryColorEntries(category) {
  const colors = {
    "Salário": "#FF7A00",
    "Bolsa": "#FF0000",
    "Mesada": "#FF00FF",
    "Transferência": "#FFFF00",
    "Outros": "#800080"
  };
  return colors[category];
}

function renderChartEntries(chartElement, chartData) {
  new Chart(chartElement, {
    type: "doughnut",
    data: {
      labels: chartData.labels,
      datasets: [{
        data: chartData.data,
        backgroundColor: chartData.backgroundColor
      }],
    },
    options: {
      borderWidth: 0,
      borderRadius: 0,
      hoverBorderWidth: 0,
      cutout: '85%',
      plugins: {
        legend: { display: false },
      },
    },
  });
}

//budget
async function displayUserBudget(userId) {
  try {
    const budgets = await getUserBudget(userId);
    let budgetData;

    if (budgets.length > 0) {
      budgetData = budgets[0];
      const budgetValue = document.getElementById('budget-valor');
      if (budgetValue) {
        budgetValue.textContent = `Budget atual: ${budgetData.valor}€`;
      } else {
      }
    } else {
      const budgetValue = document.getElementById('budget-valor');
      if (budgetValue) {
        budgetValue.textContent = 'No budget available';
      }
    }

    const monthlyBalance = await calculateMonthlyBalance(currentUserID);
    const monthlyBalanceElement = document.getElementById('remaining');
    if (monthlyBalanceElement) {
      monthlyBalanceElement.textContent = `€ ${monthlyBalance.toFixed(2)}`;
      updateSVGArc(monthlyBalance, budgetData ? budgetData.valor : 0); 
    } else {
    }
  } catch (error) {
    console.error("Error fetching or displaying budget data:", error);
  }
}

async function updateBudget(userId, valor) {
  try {
    const budgets = await getUserBudget(userId);
    
    if (budgets.length > 0) {
      const budgetRef = doc(db, 'budget', budgets[0].id);
      await updateDoc(budgetRef, { valor });
      console.log("Budget updated with valor: ", valor);
    } else {
      const budgetRef = await addDoc(collection(db, 'budget'), {
        userId: userId,
        valor: valor
      });
      console.log("New budget created with valor: ", valor);
    }
    
    displayUserBudget(userId);
  } catch (error) {
    console.error("Error updating budget:", error);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname === '/html/budget.html') {
    displayUserBudget(currentUserID);

    document.getElementById('update-budget-btn').addEventListener('click', () => {
      const budgetInput = document.getElementById('budget');
      if (budgetInput && budgetInput.value && currentUserID) {
        updateBudget(currentUserID, budgetInput.value);
      } else {
        console.error("Budget input or current user ID is not available.");
      }
    });
  }
});

function updateSVGArc(monthlyBalance, totalBudget) {
  const arcElement = document.getElementById('arc');
  const arcBackgroundElement = document.getElementById('arc-background');
  const percentageTextElement = document.querySelector('.percentage-text');

  if (arcElement && arcBackgroundElement && percentageTextElement && totalBudget > 0) {
    let percentage = (monthlyBalance / totalBudget) * 100;
    if (percentage > 100) {
      percentage = 100; 
    }

    const startAngle = 0; 
    const endAngle = percentage * 3.6;

    arcElement.setAttribute('d', describeArc(125, 125, 110, startAngle, endAngle));

    const backgroundEndAngle = 360; 
    arcBackgroundElement.setAttribute('d', describeArc(125, 125, 110, startAngle, backgroundEndAngle));

    let color;
    if (percentage < 20) {
      color = 'red'; 
    } else if (percentage < 50) {
      color = 'yellow'; 
    } else {
      color = 'green';
    }
    arcElement.setAttribute('stroke', color);

    percentageTextElement.textContent = `${percentage.toFixed(0)}%`;
  } else {
    console.log("SVG arc elements or totalBudget is not valid.");
  }
}

function describeArc(x, y, radius, startAngle, endAngle) {
  const startRadians = (startAngle - 90) * Math.PI / 180;
  const endRadians = (endAngle - 90) * Math.PI / 180;

  const x1 = x + radius * Math.cos(startRadians);
  const y1 = y + radius * Math.sin(startRadians);

  const x2 = x + radius * Math.cos(endRadians);
  const y2 = y + radius * Math.sin(endRadians);

  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

  const pathData = [
    `M ${x1} ${y1}`,
    `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`
  ];

  return pathData.join(' ');
}

//subscriptions
async function displayUserSubscriptions(userId) {
  if (window.location.pathname === '/html/subscriptions.html') {
    try {
      const subscriptions = await getUserSubscriptions(userId);
      const subscriptionsContainer = document.getElementById('subscriptions-container');

      if (!subscriptionsContainer) {
        console.error('Element with ID "subscriptions-container" not found.');
        return;
      }

      subscriptionsContainer.innerHTML = ''; 

      subscriptions.forEach(subscription => {
        const subscriptionItem = document.createElement('div');
        subscriptionItem.classList.add('row', 'grey-background', 'align-items-center');
        subscriptionItem.style.marginBottom = '20px';
        subscriptionItem.style.height = '90px';

        subscriptionItem.innerHTML = `
          <div class="col-2">
            <img src="${subscription.imagem}" width="60px" style="margin-left: 12px;">
          </div>
          <div class="col-8">
            <h2 class="text">${subscription.nome}</h2>
            <p class="subtext">Pag. automático a <span class="green">${convertDateFormat(subscription.dataPagamento)}</span></p>
          </div>
          <div class="col-2">
            <p class="valors">${subscription.valor}€</p>
          </div>
        `;

        subscriptionsContainer.appendChild(subscriptionItem);
      });
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
    }
  }
}

//spinner
document.addEventListener('DOMContentLoaded', () => {
  const spinner = document.getElementById('spinner');
  spinner.style.display = 'flex';
});

//data convert
function convertDateFormat(dateString) {
  const [year, month, day] = dateString.split('-');
  return `${day}-${month}-${year}`;
}