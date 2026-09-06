const allowedOrigins = [
    "http://localhost:5173",   // React dev server (Vite default)
    "http://localhost:3000",   // in case you use CRA instead
]

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true)
        } else {
            callback(new Error("Not allowed by CORS"))
        }
    },
    credentials: true,
}

export default corsOptions;