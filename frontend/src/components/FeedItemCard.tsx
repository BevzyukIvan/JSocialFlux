import React from "react";
import { FeedItemDTO, FeedType } from "../api/feed";
import { getAvatar } from "../utils/avatar";

type Props = {
    item: FeedItemDTO;
    onDelete?: (type: FeedType, id: number) => void;
};

const FeedItemCard: React.FC<Props> = ({ item, onDelete }) => {
    const link = item.type === "PHOTO" ? `/photos/${item.id}` : `/posts/${item.id}`;

    return (
        <div className={item.type === "PHOTO" ? "photo-card" : "post-card"}>
            {/* header */}
            <div className="post-header">
                <img className="avatar" src={getAvatar(item.avatar ?? null)} alt="avatar" />
                <div className="d-flex flex-column">
                    <a className="fw-semibold text-decoration-none" href={`/users/${item.username}`}>
                        {item.username}
                    </a>
                    <small className="text-muted">
                        {new Date(item.createdAt).toLocaleString("uk-UA")}
                        {item.edited ? " · редаговано" : ""}
                    </small>
                </div>
            </div>

            {/* content -> тепер обгорнуто в <a> */}
            {item.type === "PHOTO" ? (
                <a href={link} aria-label="Відкрити фото">
                    <div className="post-image-wrapper" style={{ cursor: "pointer" }}>
                        <img src={item.imageUrl ?? undefined} alt="photo" />
                    </div>
                </a>
            ) : (
                <a href={link} className="text-decoration-none" aria-label="Відкрити пост">
                    <div className="post-meta" style={{ cursor: "pointer" }}>
                        <div>{item.content ?? ""}</div>
                    </div>
                </a>
            )}

            {/* delete button */}
            {onDelete && (
                <div className="delete-btn-wrapper">
                    <button
                        className="btn btn-sm btn-outline-danger btn-delete"
                        onClick={(e) => {
                            e.preventDefault();   // не переходити за посиланням
                            e.stopPropagation();  // не тригерити клік по картці
                            if (onDelete) {
                                onDelete(item.type, item.id);
                            }
                        }}
                    >
                        Видалити
                    </button>
                </div>
            )}
        </div>
    );
};

export default FeedItemCard;
