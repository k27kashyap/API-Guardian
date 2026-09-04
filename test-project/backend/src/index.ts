import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/users", (req, res) => {
    res.json([
        {
            id: 1,
            name: "Khushi Kashyap",
            email: "kkashyap27100@gmail.com"
        }
    ]);
});

app.listen(3000, () => {
    console.log("Backend running on http://localhost:3000");
});