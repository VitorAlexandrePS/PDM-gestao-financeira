import { Router } from "express";

const router = Router();

router.post("/login", (req, res) => {
    const { username, password } = req.body;

    if (username === "admin" && password === "1234") {
        return res.json({
            name: "Administrador",
            username: "admin",
            token: "fake-token-admin",
        });
    }

    return res.status(401).json({
        error: "Usuário ou senha inválidos",
    });
});

export default router;