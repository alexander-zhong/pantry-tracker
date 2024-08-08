"use client";

import { useState, useEffect, useRef } from "react";
import { Box, Typography, Button, TextField, Paper } from "@mui/material";
import { db } from "./firebase";
import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  deleteDoc,
  getDoc,
} from "firebase/firestore";
import { Camera } from "react-camera-pro";
import { toast, ToastContainer } from "react-toastify";
import FlipCameraIosIcon from "@mui/icons-material/FlipCameraIos";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import "react-toastify/dist/ReactToastify.css";

export default function Home() {
  const [inventory, setInventory] = useState([]);
  const [open, setOpen] = useState(false);
  const [item, setItem] = useState({ name: "", quantity: 0 });
  const [search, setSearch] = useState("");

  // Add item
  const addItem = async (item, amount) => {
    const docRef = doc(collection(db, "inventory"), item.name);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const { quantity } = docSnap.data();
      await setDoc(docRef, {
        quantity: parseInt(quantity, 10) + parseInt(amount, 10),
      });
    } else {
      await setDoc(docRef, { quantity: amount });
    }
  };

  // Remove item
  const removeItem = async (item, amount) => {
    const docRef = doc(collection(db, "inventory"), item.name);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const { quantity } = docSnap.data();
      if (quantity <= 1 || quantity <= amount) {
        await deleteDoc(docRef);
      } else {
        await setDoc(docRef, {
          quantity: parseInt(quantity, 10) - parseInt(amount, 10),
        });
      }
    } else {
      toast.error("Item not found");
    }
  };

  // Update inventory
  const updateInventory = async () => {
    const snapshot = query(collection(db, "inventory"));
    const docs = await getDocs(snapshot);
    const inventoryList = [];
    docs.forEach((doc) => {
      if (search !== "") {
        if (doc.id.toLowerCase().includes(search.toLowerCase())) {
          inventoryList.push({ name: doc.id, ...doc.data() });
        }
      } else {
        inventoryList.push({ name: doc.id, ...doc.data() });
      }
    });
    setInventory(inventoryList);
  };

  // Camera
  const camera = useRef(null);
  const [image, setImage] = useState(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [facingMode, setFacingMode] = useState("environment");

  const handleSubmitPhoto = async () => {
    try {
      const photoDataUrl = camera.current.takePhoto();

      const payload = {
        image: photoDataUrl,
      };

      const response = await fetch("/api/openai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log(data);
    } catch (error) {
      console.error(error);
      toast.error("Error submitting photo");
    }
  };

  // Update inventory when the page loads
  useEffect(() => {
    updateInventory();
  }, []);

  return (
    <>
      <ToastContainer />
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <Typography variant="h1" sx={{ mb: 4 }}>
          Inventory Manager
        </Typography>
        <Button
          onClick={() => {
            setCameraOn((cameraOn) => !cameraOn);
          }}
        >
          Toggle AI Camera (Deactivated for this demo due to api rate)
        </Button>
        {cameraOn ? (
          <>
            <Box
              sx={{
                position: "relative",
                width: 500,
                height: 350,
                border: "1px solid #ccc",
                borderRadius: "8px",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#000",
              }}
            >
              <Camera ref={camera} />
            </Box>
            <Box sx={{ marginBottom: 2 }}>
              <Button
                onClick={() =>
                  setFacingMode((prevMode) =>
                    prevMode === "environment" ? "user" : "environment"
                  )
                }
              >
                <FlipCameraIosIcon />
              </Button>
              <Button>
                {"/* onClick={handleSubmitPhoto} */ "}
                <CameraAltIcon />
              </Button>
            </Box>
          </>
        ) : null}

        <Box
          sx={{ bgcolor: "slate", display: "flex", flexDirection: "column" }}
        >
          <Paper
            elevation={3}
            sx={{ padding: 2, maxWidth: 600, width: "100%", marginBottom: 3 }}
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <TextField
                variant="filled"
                sx={{ marginRight: 1 }}
                type="text"
                label="Name"
                value={item.name}
                onChange={(e) => {
                  setItem({ ...item, name: e.target.value });
                }}
              />

              <TextField
                variant="filled"
                label="Quantity"
                type="number"
                value={item.quantity}
                onChange={(e) => {
                  setItem({ ...item, quantity: e.target.value });
                }}
              />
              <Button
                sx={{ marginLeft: 1 }}
                onClick={() => {
                  if (item.name === "" || item.quantity <= 0) {
                    toast.error("Enter valid values!");
                  } else {
                    addItem({ ...item, name: item.name.trim() }, item.quantity);
                    setItem({ name: "", quantity: 0 });
                    updateInventory();
                  }
                }}
              >
                Add
              </Button>
              <Button
                onClick={() => {
                  if (item.name === "" || item.quantity <= 0) {
                    toast.error("Enter valid values!");
                  } else {
                    removeItem(
                      { ...item, name: item.name.trim() },
                      item.quantity
                    );
                    setItem({ name: "", quantity: 0 });
                    updateInventory();
                  }
                }}
              >
                Remove
              </Button>
            </Box>
          </Paper>

          <Paper
            elevation={3}
            sx={{ padding: 2, maxWidth: 600, width: "100%" }}
          >
            <TextField
              variant="filled"
              label="Search"
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                updateInventory();
              }}
              sx={{ width: "100%", marginBottom: 2 }}
            />
            {inventory.length <= 0 ? (
              <Typography variant="h6" sx={{ color: "gray" }}>
                Empty
              </Typography>
            ) : (
              <ul className="text-xxl">
                {inventory.map((obj) => (
                  <li
                    key={obj.name}
                    className="my-4 w-full flex justify-between bg-grey-950 "
                  >
                    <div className="p-4 w-full flex justify-between">
                      <Typography>{obj.name}</Typography>
                      <Typography>{obj.quantity}</Typography>
                    </div>
                    <Button
                      sx={{ borderLeft: "4px solid" }}
                      onClick={(e) => {
                        e.preventDefault();
                        addItem(
                          { name: obj.name.trim(), quantity: obj.quantity },
                          1
                        );
                        updateInventory();
                      }}
                    >
                      +
                    </Button>
                    <Button
                      sx={{ borderRight: "4px solid" }}
                      onClick={(e) => {
                        e.preventDefault();
                        removeItem(
                          { name: obj.name.trim(), quantity: obj.quantity },
                          1
                        );
                        updateInventory();
                      }}
                    >
                      -
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </Paper>
        </Box>
      </Box>
    </>
  );
}
