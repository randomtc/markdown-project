import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.tsx'
import ComparisonDemo from './ComparisonDemo.tsx'
import './index.css'




ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <BrowserRouter>

            <Routes>
                <Route path="/markdown-project/*" element={<App />} />
                <Route path="/markdown-project/demo" element={<ComparisonDemo />} />
            </Routes>

        </BrowserRouter>
    </React.StrictMode>,
)
