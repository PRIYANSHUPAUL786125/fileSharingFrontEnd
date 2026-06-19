import React, { useState, useRef } from "react";
import { useLogout } from "../services/api";
import axios from "axios";
import API from "../services/api";
import EmailShare from "./ShareEmail";

export default function HomePage() {
    const [fileUrl, setFileUrl] = useState("");
    const [fileUuid, setFileUuid] = useState("");
    const handleLogout = useLogout();
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState(null);
    const [uploadStatus, setUploadStatus] = useState({
        loading: false,
        message: "",
        error: false,
    });
    const fileInputRef = useRef(null);

    // 1. Handle Drag Events
    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
            setFileUrl(""); // 👈 Clear old share links when a new file is dropped
setFileUuid(""); // 👈 Clear previous UUID on fresh drop
            setUploadStatus({ loading: false, message: "", error: false });
        }
    };

    // 2. Handle Manual File Selection via Click
    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setFileUrl(""); // 👈 Clear old share links when a new file is dropped
setFileUuid(""); // 👈 Clear previous UUID on fresh drop
            setUploadStatus({ loading: false, message: "", error: false });
        }
    };

    // 3. Handle File Upload Request
    const handleUpload = async () => {
        if (!file) return;

        const formData = new FormData();
        formData.append("myfile", file);

        setUploadStatus({
            loading: true,
            message: "Uploading your file...",
            error: false,
        });

        try {
            // Sent with credentials so your httpOnly accessToken cookie is attached automatically
            const res = await API.post("/files/", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            console.log(res.data.data.url);
            // setUploadedFileData(response.data.data);
            setFileUrl(res.data.data.url);
            setFileUuid(res.data.data.file.uuid);
            setUploadStatus({
                loading: false,
                message: "🎉 File uploaded successfully!",
                error: false,
            });
            setFile(null); // Clear file selection after success
        } catch (err) {
            setUploadStatus({
                loading: false,
                message:
                    err.response?.data?.message ||
                    "Failed to upload file. Try again.",
                error: true,
            });
        }
    };

    // 4. Handle Logout (Clears cookies on backend)
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white flex flex-col">
            {/* Navbar Header */}
            <header className="w-full bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center shadow-sm">
                <h1 className="text-xl font-bold tracking-tight text-indigo-600 dark:text-indigo-400">
                    CloudShare
                </h1>
                <button
                    onClick={handleLogout}
                    className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50 rounded-lg transition"
                >
                    Sign Out
                </button>
            </header>

            {/* Main Drag & Drop Section */}
            <main className="flex-1 flex flex-col items-center justify-center p-6 max-w-2xl mx-auto w-full">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-extrabold tracking-tight">
                        Upload and Share Files
                    </h2>
                    <p className="mt-2 text-gray-500 dark:text-gray-400">
                        Drag and drop your file below or browse from your
                        computer.
                    </p>
                </div>

                {/* Drag Zone Wrapper */}
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current.click()}
                    className={`w-full aspect-video border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all duration-200 ${
                        isDragging
                            ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 scale-[0.99]"
                            : "border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-600"
                    }`}
                >
                    {/* Hidden File Input */}
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                    />

                    {/* Icon Change based on State */}
                    <svg
                        className={`h-12 w-12 mb-4 transition-colors ${isDragging ? "text-indigo-500" : "text-gray-400"}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                    </svg>

                    {file ? (
                        <div className="space-y-1">
                            <p className="font-semibold text-indigo-600 dark:text-indigo-400 max-w-md truncate">
                                {file.name}
                            </p>
                            <p className="text-xs text-gray-400">
                                {(file.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                        </div>
                    ) : (
                        <div>
                            <p className="font-medium text-gray-700 dark:text-gray-300">
                                {isDragging
                                    ? "Drop your file here!"
                                    : "Drag your file here, or click to browse"}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                                Supports files up to 10MB
                            </p>
                        </div>
                    )}
                </div>

                {/* Action Button & Status Handling */}
                {file && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleUpload();
                        }}
                        disabled={uploadStatus.loading}
                        className="mt-6 w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md transition disabled:bg-indigo-400 cursor-pointer text-center"
                    >
                        {uploadStatus.loading ? "Uploading..." : "Start Upload"}
                    </button>
                )}

                {/* Feedback Alert Box */}
                {uploadStatus.message && (
                    <div
                        className={`mt-6 w-full p-4 rounded-xl text-sm font-medium border text-center ${
                            uploadStatus.error
                                ? "bg-red-50 text-red-800 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/50"
                                : "bg-green-50 text-green-800 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/50"
                        }`}
                    >
                        {uploadStatus.message}
                    </div>
                )}
                {fileUrl && (
                    <div className="w-full max-w-xl mx-auto mt-6 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm transition-all duration-200">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                            Your Secure Share Link
                        </label>

                        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700/80 rounded-lg p-1 pl-3 transition-colors focus-within:border-indigo-500 dark:focus-within:border-indigo-500">
                            {/* Read-Only Link Display */}
                            <input
                                type="text"
                                readOnly
                                value={fileUrl}
                                className="flex-1 bg-transparent text-sm text-gray-700 dark:text-gray-300 outline-none select-all font-medium truncate"
                            />

                            {/* Action Button */}
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(fileUrl);
                                    // Optional: Add a temporary state here to change text to "Copied!" for better UX
                                    alert("Link copied to clipboard!");
                                }}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white text-xs font-semibold rounded-md transition-colors shadow-sm focus:outline-none cursor-pointer"
                            >
                                Copy Link
                            </button>
                        </div>
                    </div>
                )}
    {fileUrl && fileUuid && (
        <EmailShare fileUuid={fileUuid} />
    )}
            </main>
        </div>
    );
}
