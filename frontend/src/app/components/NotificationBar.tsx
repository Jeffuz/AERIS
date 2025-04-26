"use client";

import React, { useState } from "react";
import { IoClose } from "react-icons/io5";

interface Notification {
  id: number;
  message: string;
  status: string;
  onDelete: (id: number) => void;
}

const NotificationButton = ({
  id,
  message,
  status,
  onDelete,
}: Notification) => {
  return (
    <div
      className={`px-2 py-0.5 flex items-center w-fit gap-1.5 rounded-full h-fit ${
        status === "warning"
          ? "text-[#AF6526] bg-[#2D261B]"
          : status === "critical"
          ? "text-[#8A3836] bg-[#2C1E1F]"
          : ""
      }`}
    >
      <span>{message}</span>
      <button onClick={() => onDelete(id)} className="cursor-pointer">
        <IoClose />
      </button>
    </div>
  );
};

const NotificationBar = () => {
  // @TODO: fetch notification from the server
  const notificationData = [
    { id: 1, message: "Drone 1 has completed its mission", status: "critical" },
    { id: 2, message: "Drone 2 is low on battery", status: "warning" },
    {
      id: 3,
      message: "Drone 3 has encountered an obstacle",
      status: "warning",
    },
  ];

  const [notificaition, setNotification] = useState(notificationData);

  //   Delete notification
  function handleDelete(id: number): void {
    setNotification((prevNotifications) =>
      prevNotifications.filter((notification) => notification.id !== id)
    );
  }

  return (
    <nav className="flex w-full space-x-3 h-[56px] items-center border-b border-gray-800 px-4">
      {notificaition.map((data) => (
        <NotificationButton {...data} key={data.id} onDelete={handleDelete} />
      ))}
    </nav>
  );
};

export default NotificationBar;
