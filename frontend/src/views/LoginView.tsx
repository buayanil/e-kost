import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { loginRequest } from "../services/authService";
import axios from "axios";

const schema = z.object({
    username: z.string().min(1, "Username is required"),
    password: z.string().min(1, "Password is required"),
});

type FormData = z.infer<typeof schema>;

export default function LoginView() {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setError,
        clearErrors,
    } = useForm<FormData>({ resolver: zodResolver(schema) });

    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = (location.state as any)?.from || "/";

    const onSubmit = async (data: FormData) => {
        clearErrors("root"); // clear any prior server error
        try {
            const { token } = await loginRequest(data);
            await login(token);
            navigate(from, { replace: true });
        } catch (e: unknown) {
            // Axios-specific handling
            if (axios.isAxiosError(e)) {
                const status = e.response?.status;

                // If your backend sends a message we can use it:
                const serverMsg =
                    (e.response?.data as any)?.message ??
                    (e.response?.data as any)?.error ??
                    null;

                if (status === 401) {
                    // invalid credentials
                    setError("root", {
                        type: "server",
                        message: serverMsg || "Invalid username or password.",
                    });
                    return;
                }

                if (status === 400 || status === 422) {
                    // Optional: map precise messages to fields if your API provides them
                    if (serverMsg?.toLowerCase().includes("username")) {
                        setError("username", { type: "server", message: serverMsg });
                        return;
                    }
                    if (serverMsg?.toLowerCase().includes("password")) {
                        setError("password", { type: "server", message: serverMsg });
                        return;
                    }
                }

                // generic server error
                setError("root", {
                    type: "server",
                    message: serverMsg || "Something went wrong. Please try again.",
                });
            } else {
                // non-Axios error
                setError("root", {
                    type: "server",
                    message: "Unexpected error. Please try again.",
                });
            }
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="bg-white p-8 rounded shadow-md w-96 space-y-4"
            >
                <h1 className="text-2xl font-bold text-center">Login</h1>

                <div>
                    <label className="block mb-1 font-semibold" htmlFor="username">
                        Username
                    </label>
                    <input
                        id="username"
                        type="text"
                        {...register("username")}
                        className="w-full border rounded px-3 py-2"
                        aria-invalid={!!errors.username}
                    />
                    {errors.username && (
                        <p className="text-red-500 text-sm">{errors.username.message}</p>
                    )}
                </div>

                <div>
                    <label className="block mb-1 font-semibold" htmlFor="password">
                        Password
                    </label>
                    <input
                        id="password"
                        type="password"
                        {...register("password")}
                        className="w-full border rounded px-3 py-2"
                        aria-invalid={!!errors.password}
                    />
                    {errors.password && (
                        <p className="text-red-500 text-sm">{errors.password.message}</p>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? "Logging in…" : "Login"}
                </button>

                {/* Top-level server error */}
                {errors.root && (
                    <p className="text-red-500 text-sm">{errors.root.message}</p>
                )}
            </form>
        </div>
    );
}
