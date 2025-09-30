import React from "react";
import { UserCardDTO } from "../api/search";
import { Link } from "react-router-dom";
import "./user-card.css";

type Props = { user: UserCardDTO };

const UserCard: React.FC<Props> = ({ user }) => {
    const avatar =
        user.avatar && user.avatar.trim().length > 0
            ? user.avatar
            : "/images/default-avatar.png";

    return (
        <div className="user-card">
            <img src={avatar} alt="avatar" />
            <Link to={`/users/${user.username}`}>{user.username}</Link>
        </div>
    );
};

export default UserCard;
