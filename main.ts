import { Hono } from "hono";
import { cors } from "hono/cors";
import "jsr:@std/dotenv/load";
import axiod from "https://deno.land/x/axiod/mod.ts";

const app = new Hono();
app.use(
  "/api/*",
  cors({
    origin: Deno.env.get("ALLOW_ORIGIN") || "http://localhost:5173",
    credentials: true, // Permite cookies y credenciales
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    exposeHeaders: ["Content-Length", "Set-Cookie"],
  })
);

app.get("/api/proxy-login", (c) => {
  return c.text("Hello Hono!");
});

app.post("/api/proxy-login", async (c) => {
  const { username, password } = await c.req.json();

  const formData = new URLSearchParams({
    _username: username,
    _password: password,
    _remember_me: "on",
  });

  const response = await fetch("https://siipi.izt.uam.mx/login_check", {
    method: "POST",
    body: formData,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json, text/plain, */*",
    },
    redirect: "manual",
    credentials: "include",
  });

  const cookies = response.headers.getSetCookie();

  console.log("Reponse: ", response);

  return c.json({ cookies });
});

app.get("/api/proxy-alumno", async (c) => {
  const cookies = await c.req.header("Cookie");
  const response = await axiod
    .get("https://siipi.izt.uam.mx/alumno", {
      headers: {
        cookie: cookies,
      },
    })
    .catch((error) => {
      if (error.response) {
        return error.response;
      }
      throw error;
    });

  const cleanedData = response.data
    .split("INFORMACIÓN DEL ALUMNO PARA EL TRIMESTRE ")[1]
    .split('<table class="table-striped table">')[0]
    .replace(/<\/?[^>]+(>|$)/g, "");

  const trimester = cleanedData.split("ALUMNO")[0].trim();
  const name = cleanedData.split("ALUMNO:")[1].split("ESTADO")[0].trim();
  const status = cleanedData
    .split("ESTADO:")[1]
    .split("TRIMESTRE INGRESO")[0]
    .trim();
  const firstTrimester = cleanedData
    .split("TRIMESTRE INGRESO:")[1]
    .split("MATRÍCULA")[0]
    .trim();
  const studentId = cleanedData
    .split("MATRÍCULA:")[1]
    .split("DEDICACIÓN")[0]
    .trim();
  const dedication = cleanedData
    .split("DEDICACIÓN:")[1]
    .split("ÚLTIMO TRIMESTRE")[0]
    .trim();
  const lastTrimester = cleanedData
    .split("ÚLTIMO TRIMESTRE INSCRITO:")[1]
    .split("DIVISIÓN")[0]
    .trim();
  const division = cleanedData
    .split("DIVISIÓN:")[1]
    .split("CRÉDITOS INSCRITOS")[0]
    .trim();
  const enrolledCredits = cleanedData
    .split("CRÉDITOS INSCRITOS:")[1]
    .split("CRÉDITOS CONTABILIZADOS")[0]
    .trim();
  const totalCredits = cleanedData
    .split("CRÉDITOS CONTABILIZADOS:")[1]
    .split("PLAN")[0]
    .trim();
  const plan = cleanedData
    .split("PLAN:")[1]
    .split("CLAVE DEL PLAN")[0]
    .split("\n")[0]
    .trim();
  const planKey = cleanedData
    .split("CLAVE DEL PLAN:")[1]
    .split("E-MAIL")[0]
    .split("\n")[0]
    .trim();
  const email = cleanedData.split("E-MAIL:")[1].trim();

  return c.json({
    success: true,
    trimester,
    name,
    status,
    firstTrimester,
    studentId,
    dedication,
    lastTrimester,
    division,
    enrolledCredits,
    totalCredits,
    plan,
    planKey,
    email,
  });
});

Deno.serve(app.fetch);
