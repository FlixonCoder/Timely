import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { User, Mail, Calendar, Camera, Save, Sparkles, Pencil } from "lucide-react";
import api from "../utils/api";
import { toast } from "react-toastify";

const Profile = () => {
    const { user, setUser } = useAuth();
    const initial = user?.name?.charAt(0)?.toUpperCase() || "U";
    const fileInputRef = React.useRef(null);

    const [isEditing, setIsEditing] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        username: "",
        email: "",
        dob: "",
    });

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || "",
                username: user.username || "",
                email: user.email || "",
                dob: user.dob ? new Date(user.dob).toISOString().split("T")[0] : "",
            });
            setImagePreview(user.image || null);
        }
    }, [user]);

    const handleSave = async () => {
        try {
            const data = new FormData();
            data.append("name", formData.name);
            data.append("username", formData.username);
            data.append("dob", formData.dob);

            // If there's a file selected (fileInputRef), append it
            // We need to track the actual file object, not just the preview URL
            if (fileInputRef.current?.files[0]) {
                data.append("image", fileInputRef.current.files[0]);
            }

            const response = await api.put("/api/user/update-profile", data, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            if (response.data.success) {
                setUser(response.data.user);
                toast.success("Profile updated successfully!");
                if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                }
                setIsEditing(false);
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            console.error("Profile update failed", error);
            toast.error(error.response?.data?.message || "Profile update failed");
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="h-56 sm:h-64 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />

            {/* Card Wrapper */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-24 pb-20">
                <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-visible relative">

                    {/* Avatar + Name */}
                    <div className="flex flex-col items-center text-center px-6 pt-10 pb-6">
                        <div className="relative group">
                            <div className="w-32 h-32 rounded-full bg-white dark:bg-gray-700 border-4 border-white dark:border-gray-800 shadow-lg flex items-center justify-center overflow-hidden relative">
                                {imagePreview ? (
                                    <img src={imagePreview} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-5xl font-bold text-gray-400">{initial}</span>
                                )}

                                {/* Overlay for Edit Mode */}
                                {isEditing && (
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                    >
                                        <Camera className="text-white" size={32} />
                                    </div>
                                )}
                            </div>

                            {/* Hidden File Input */}
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImageChange}
                                accept="image/*"
                                className="hidden"
                            />

                            {isEditing && (
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute bottom-1 right-1 p-2 bg-blue-600 text-white rounded-full shadow hover:bg-blue-700 active:scale-95 transition-transform animate-in zoom-in"
                                >
                                    <Camera size={16} />
                                </button>
                            )}
                        </div>

                        <h1 className="mt-4 text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            {formData.name || "Guest User"}
                            <Sparkles className="text-amber-500" size={22} />
                        </h1>

                        <p className="text-blue-600 dark:text-blue-400 font-medium">
                            @{formData.username || "guest"}
                        </p>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700" />

                    {/* Form */}
                    <div className="px-6 py-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Full Name */}
                        <InputField
                            label="Full Name"
                            icon={<User size={18} />}
                            value={formData.name}
                            onChange={(v) => setFormData({ ...formData, name: v })}
                            disabled={!isEditing}
                        />

                        {/* Email */}
                        <InputField
                            label="Email Address"
                            icon={<Mail size={18} />}
                            value={formData.email}
                            disabled={true} // Email always disabled
                        />

                        {/* Username */}
                        <InputField
                            label="Username"
                            prefix="@"
                            value={formData.username}
                            onChange={(v) => setFormData({ ...formData, username: v })}
                            disabled={!isEditing}
                        />

                        {/* DOB */}
                        <InputField
                            label="Date of Birth"
                            icon={<Calendar size={18} />}
                            type="date"
                            value={formData.dob}
                            onChange={(v) => setFormData({ ...formData, dob: v })}
                            disabled={!isEditing}
                        />
                    </div>

                    {/* Actions */}
                    <div className="px-6 pb-6 flex justify-end border-t border-gray-100 dark:border-gray-800 pt-6">
                        {isEditing ? (
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="px-6 py-2.5 text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow active:scale-95 transition-all"
                                >
                                    <Save size={18} />
                                    Save Changes
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold rounded-xl shadow hover:opacity-90 active:scale-95 transition-all"
                            >
                                <Pencil size={16} />
                                Edit Profile
                            </button>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

/* ---------- Reusable Input ---------- */
const InputField = ({
    label,
    icon,
    prefix,
    type = "text",
    value,
    disabled,
    onChange,
}) => (
    <div className="space-y-1.5">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
        </label>
        <div className="relative">
            {icon && (
                <div className="absolute inset-y-0 left-3 flex items-center text-gray-400">
                    {icon}
                </div>
            )}
            {prefix && (
                <div className="absolute inset-y-0 left-3 flex items-center text-gray-400 font-semibold">
                    {prefix}
                </div>
            )}
            <input
                type={type}
                value={value}
                disabled={disabled}
                onChange={(e) => onChange?.(e.target.value)}
                className={`w-full ${icon || prefix ? "pl-10" : "pl-4"
                    } pr-4 py-2.5 rounded-xl border text-sm
          bg-gray-50 dark:bg-gray-700
          border-gray-200 dark:border-gray-600
          text-gray-900 dark:text-white
          focus:ring-2 focus:ring-blue-500 outline-none
          transition-all
          ${disabled ? "opacity-60 cursor-not-allowed bg-gray-100 dark:bg-gray-800" : "bg-white dark:bg-gray-900"}
        `}
            />
        </div>
    </div>
);

export default Profile;
