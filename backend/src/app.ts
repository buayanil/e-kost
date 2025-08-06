import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import tenantRoutes from './routes/tenant';
import roomRoutes from "./routes/room";
import roomAssignmentRoutes from "./routes/roomAssignment";
import tenantTransactionRoutes from "./routes/tenantTransaction";
import summaryRoutes from "./routes/summary";
import meRoutes from "./routes/me";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/tenants', tenantRoutes);
app.use("/rooms", roomRoutes);
app.use("/assignments", roomAssignmentRoutes);
app.use("/transactions", tenantTransactionRoutes);
app.use("/summary", summaryRoutes);
app.use("/me", meRoutes);

app.get('/', (req, res) => {
    res.send('✅ e-kost backend is running');
});

// Only start the server if not in test
if (process.env.NODE_ENV !== 'test') {
    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
        console.log(`🚀 Server listening on http://localhost:${PORT}`);
    });
}

export default app;
