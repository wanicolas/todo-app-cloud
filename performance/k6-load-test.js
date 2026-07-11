import http from "k6/http";
import { check, sleep } from "k6";

// Configurations du test de charge k6
export const options = {
  stages: [
    { duration: "10s", target: 5 }, // Phase de montée en charge (Ramp-up) : 5 utilisateurs virtuels (VUs)
    { duration: "20s", target: 15 }, // Phase de stress léger : montée à 15 VUs
    { duration: "20s", target: 15 }, // Maintien de la charge à 15 VUs
    { duration: "10s", target: 0 }, // Phase de descente (Ramp-down)
  ],
  thresholds: {
    // Critères de performance (SLA) :
    // 95% des requêtes doivent être traitées en moins de 300ms
    http_req_duration: ["p(95)<300"],
    // Le taux d'échec des requêtes doit être inférieur à 1%
    http_req_failed: ["rate<0.01"],
  },
};

// URL cible (par défaut localhost via le Reverse Proxy Traefik en local)
const BASE_URL = __ENV.TARGET_URL || "http://localhost:3080";

export default function () {
    const uniqueId = `${__VU}-${__ITER}`;
    const email = `perf-${uniqueId}-${Date.now()}-${Math.floor(Math.random() * 1000000)}@example.com`;
    const password = 'Password123!';

  const headers = { "Content-Type": "application/json" };

  // --- Étape 1 : Appel du Point d'Entrée Public (Greeting API) ---
  const resGreeting = http.get(`${BASE_URL}/api/greeting`);
  check(resGreeting, {
    "Greeting - status is 200": (r) => r.status === 200,
    "Greeting - contains message": (r) =>
      JSON.parse(r.body).greeting !== undefined,
  });

  sleep(1);

  // --- Étape 2 : Inscription de l'utilisateur (Register) ---
  const registerPayload = JSON.stringify({ email, password });
  const resRegister = http.post(
    `${BASE_URL}/api/auth/register`,
    registerPayload,
    { headers },
  );

  const isRegisterOk = check(resRegister, {
    "Register - status is 201": (r) => r.status === 201,
    "Register - returns token": (r) => JSON.parse(r.body).token !== undefined,
  });

  let token = "";
  if (isRegisterOk) {
    token = JSON.parse(resRegister.body).token;
  } else {
    // En cas d'échec d'inscription (ex: utilisateur déjà existant sur itérations suivantes), on tente une connexion
    const loginPayload = JSON.stringify({ email, password });
    const resLogin = http.post(`${BASE_URL}/api/auth/login`, loginPayload, {
      headers,
    });
    check(resLogin, {
      "Login fallback - status is 200": (r) => r.status === 200,
    });
    if (resLogin.status === 200) {
      token = JSON.parse(resLogin.body).token;
    }
  }

  if (!token) {
    // Si pas de token, on arrête cette itération de l'utilisateur virtuel
    return;
  }

  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  sleep(1);

  // --- Étape 3 : Création d'une tâche (Create Todo) ---
  const todoPayload = JSON.stringify({ name: `Load test task - ${uniqueId}` });
  const resCreateTodo = http.post(`${BASE_URL}/api/items`, todoPayload, {
    headers: authHeaders,
  });

    const isTodoCreated = check(resCreateTodo, {
        'Create Todo - status is 200': (r) => r.status === 200,
        'Create Todo - returns task details': (r) => JSON.parse(r.body).id !== undefined,
    });

  let todoId = "";
  if (isTodoCreated) {
    todoId = JSON.parse(resCreateTodo.body).id;
  }

  sleep(1);

  // --- Étape 4 : Lecture de la liste de tâches (Get Todos) ---
  const resGetTodos = http.get(`${BASE_URL}/api/items`, {
    headers: authHeaders,
  });
  check(resGetTodos, {
    "Get Todos - status is 200": (r) => r.status === 200,
    "Get Todos - is array": (r) => Array.isArray(JSON.parse(r.body)),
  });

  sleep(1);

  // --- Étape 5 : Nettoyage / Suppression du compte (RGPD / Droit à l'oubli) ---
  // Cette étape permet d'éviter l'accumulation de milliers d'utilisateurs et de tâches en base de données.

  // 5.1 : Suppression de la tâche créée
  if (todoId) {
    const resDeleteTodo = http.del(`${BASE_URL}/api/items/${todoId}`, null, {
      headers: authHeaders,
    });
    check(resDeleteTodo, {
      "Delete Todo - status is 200": (r) => r.status === 200,
    });
  }

    // 5.2 : Suppression définitive du compte utilisateur
    const resDeleteAccount = http.del(`${BASE_URL}/api/auth/me`, null, { headers: authHeaders });
    check(resDeleteAccount, {
        'Delete Account - status is 204': (r) => r.status === 204,
    });

  sleep(1);
}
