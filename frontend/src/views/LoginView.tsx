import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { loginRequest } from "../services/authService";

const schema = z.object({
    username: z.string().min(1, "Username is required"),
    password: z.string().min(1, "Password is required"),
});

type FormData = z.infer<typeof schema>;

export default function LoginView() {
    const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
    });

    const { login } = useAuth();
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const onSubmit = async (data: FormData) => {
        try {
            const { token } = await loginRequest(data);
            login(token);           // Save to AuthContext
            navigate("/");          // Redirect to dashboard
        } catch (err: any) {
            if (err.response && err.response.status === 401) {
                setError("Invalid username or password");
            } else {
                setError("Something went wrong");
            }
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-8 rounded shadow-md w-96 space-y-4">
                <h1 className="text-2xl font-bold text-center">Login</h1>

                <div>
                    <label className="block mb-1 font-semibold">Username</label>
                    <input
                        type="text"
                        {...register("username")}
                        className="w-full border rounded px-3 py-2"
                    />
                    {errors.username && <p className="text-red-500 text-sm">{errors.username.message}</p>}
                </div>

                <div>
                    <label className="block mb-1 font-semibold">Password</label>
                    <input
                        type="password"
                        {...register("password")}
                        className="w-full border rounded px-3 py-2"
                    />
                    {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
                </div>

                {error && <p className="text-red-600 text-center">{error}</p>}

                <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
                    Login
                </button>
            </form>
        </div>
    );
}
