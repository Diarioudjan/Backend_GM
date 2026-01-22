const request = require("supertest");
const app = require("../server");

describe("Auth API", () => {
  describe("POST /api/auth/register", () => {
    it("devrait créer un nouvel utilisateur", async () => {
      const uniqueEmail = `test_${Date.now()}@example.com`;
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          nom: "Test",
          prenom: "User",
          email: uniqueEmail,
          telephone: "123456789",
          password: "motdepasse123",
          adresse: "Test Address"
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty("data");
      expect(res.body.data).toHaveProperty("token");
      expect(res.body.data).toHaveProperty("user");
      expect(res.body.data.user.email).toBe(uniqueEmail);
    });

    it("ne doit pas créer un utilisateur avec un email existant", async () => {
      const email = `test_${Date.now()}@example.com`;
      
      // Créer le premier utilisateur
      await request(app)
        .post("/api/auth/register")
        .send({
          nom: "Test",
          prenom: "User 1",
          email: email,
          telephone: "123456789",
          password: "motdepasse123",
          adresse: "Test Address"
        });

      // Essayer de créer un deuxième utilisateur avec le même email
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          nom: "Test",
          prenom: "User 2",
          email: email,
          telephone: "123456790",
          password: "motdepasse123",
          adresse: "Test Address 2"
        });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty("message");
    });

    it("ne doit pas créer un utilisateur avec des données invalides", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          nom: "",
          prenom: "",
          email: "invalid-email",
          telephone: "123",
          password: "123",
          adresse: ""
        });

      expect(res.statusCode).toBe(400);
    });
  });

  describe("POST /api/auth/login", () => {
    it("devrait connecter un utilisateur existant", async () => {
      const email = `test_${Date.now()}@example.com`;
      const password = "motdepasse123";

      // Créer un utilisateur
      await request(app)
        .post("/api/auth/register")
        .send({
          nom: "Test",
          prenom: "User",
          email: email,
          telephone: "123456789",
          password: password,
          adresse: "Test Address"
        });

      // Se connecter
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: email,
          password: password
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("data");
      expect(res.body.data).toHaveProperty("token");
      expect(res.body.data).toHaveProperty("user");
      expect(res.body.data.user.email).toBe(email);
    });

    it("ne doit pas connecter avec des identifiants incorrects", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: "nonexistent@example.com",
          password: "wrongpassword"
        });

      expect(res.statusCode).toBe(401);
    });
  });

  describe("GET /api/auth/me", () => {
    it("devrait retourner les informations de l'utilisateur connecté", async () => {
      const email = `test_${Date.now()}@example.com`;
      
      // Créer et connecter un utilisateur
      const registerRes = await request(app)
        .post("/api/auth/register")
        .send({
          nom: "Test",
          prenom: "User",
          email: email,
          telephone: "123456789",
          password: "motdepasse123",
          adresse: "Test Address"
        });

      const token = registerRes.body.data.token;

      // Récupérer les informations de l'utilisateur
      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("data");
      expect(res.body.data).toHaveProperty("user");
      expect(res.body.data.user.email).toBe(email);
    });

    it("ne doit pas retourner les informations sans token", async () => {
      const res = await request(app)
        .get("/api/auth/me");

      expect(res.statusCode).toBe(401);
    });
  });
});
