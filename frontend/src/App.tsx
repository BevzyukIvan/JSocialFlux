import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import LoginPage from "./pages/Login";
import RegisterPage from "./pages/Register";
import LogoutPage from "./pages/Logout";
import SearchPage from "./pages/Search";
import Profile from "./pages/Profile.tsx";
import NewPhoto from "./pages/NewPhoto";
import NewPost from "./pages/NewPost";
import PhotoPage from "./pages/PhotoPage";
import PostPage from "./pages/PostPage";
import EditPost from "./pages/EditPost.tsx";
import EditPhoto from "./pages/EditPhoto.tsx";
import FollowersPage from "./pages/FollowersPage";
import ChatListPage from "./pages/ChatListPage.tsx";
import ChatPage from "./pages/ChatPage.tsx";
import StartPrivateRedirect from "./pages/StartPrivateRedirect";
import GroupChatCreatePage from "./pages/GroupChatCreatePage.tsx";
import ProfileEditPage from "./pages/ProfileEditPage.tsx";


const App: React.FC = () => (
    <Routes>
        <Route path="/" element={<Home/>}/>
        <Route path="/login" element={<LoginPage/>}/>
        <Route path="/register" element={<RegisterPage/>}/>
        <Route path="/logout" element={<LogoutPage/>}/>
        <Route path="*" element={<Navigate to="/" replace />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/users/:username" element={<Profile />} />
        <Route path="/photos/new" element={<NewPhoto />} />
        <Route path="/posts/new"  element={<NewPost  />} />
        <Route path="/photos/:id" element={<PhotoPage />} />
        <Route path="/posts/:id" element={<PostPage />} />
        <Route path="/photos/:id/edit" element={<EditPhoto />} />
        <Route path="/posts/:id/edit" element={<EditPost />} />
        <Route path="/users/:username/network" element={<FollowersPage />} />
        <Route path="/chats" element={<ChatListPage />} />
        <Route path="/chats/:chatId" element={<ChatPage />} />
        <Route path="/chats/with/:username" element={<StartPrivateRedirect />} />
        <Route path="/chats/new-group" element={<GroupChatCreatePage />} />
            <Route path="/users/:username/edit" element={<ProfileEditPage />} />
    </Routes>
);

export default App;
