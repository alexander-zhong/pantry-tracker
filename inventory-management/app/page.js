"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Stack,
  Typography,
  Button,
  Modal,
  TextField,
  Paper,
  FormControl,
} from "@mui/material";
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

export default function Home() {
  const [inventory, setInventory] = useState([{ name: "cake", quantity: 1 }]);
  const [open, setOpen] = useState(false);
  const [item, setItem] = useState({ name: "", quantity: 0 });

  // Add item
  const addItem = async (item, amount) => {
    const docRef = doc(collection(db, "inventory"), item);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const { quantity } = docSnap.data;
      await setDoc(docRef, { quantity: quantity + amount });
    } else {
      await setDoc(docRef, { quantity: amount });
    }
  };

  // Remove item
  const removeItem = async (item, amount) => {
    const docRef = doc(collection(db, "inventory"), item);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const { quantity } = docSnap.data;
      if (quantity <= 1 || quantity <= amount) {
        await deleteDoc(docRef);
      } else {
        await setDoc(docRef, { quantity: quantity - amount });
      }
    } else {
      await setDoc(docRef, { quantity: 1 });
    }
  };

  // Update inventory
  const updateInventory = async () => {
    const snapshot = query(collection(db, "inventory"));
    const docs = await getDocs(snapshot);
    const inventoryList = [];
    docs.forEach((doc) => {
      inventoryList.push({ id: doc.id, ...doc.data() });
    });
    setInventory(inventoryList);
  };

  // Update inventory when the page loads
  useEffect(() => {
    updateInventory();
  }, []);

  return (
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
      <Box sx={{ bgcolor: "slate", display: "flex", flexDirection: "column" }}>
        <Paper
          elevation={3}
          sx={{ padding: 2, maxWidth: 600, width: "100%", marginBottom: 3 }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <TextField
              variant="filled"
              sx={{ marginRight: 1 }}
              label="Name"
              onChange={(e) => {
                setItem({ ...item, name: e.target.value });
              }}
            />
            <TextField
              variant="filled"
              label="Quantity"
              onChange={(e) => {
                setItem({ ...item, quantity: e.target.value });
              }}
            />
            <Button sx={{ marginLeft: 1 }}>Add</Button>
            <Button>Remove</Button>
          </Box>
        </Paper>

        <Paper elevation={3} sx={{ padding: 2, maxWidth: 600, width: "100%" }}>
          <ul className="text-xxl">
            {inventory.map((item, id) => (
              <li
                key={id}
                className="my-4 w-full flex justify-between bg-grey-950 "
              >
                <div className="p-4 w-full flex justify-between">
                  <Typography>{item.name}</Typography>
                  <Typography>{item.quantity}</Typography>
                </div>
                <Button sx={{ borderLeft: "4px solid" }}>+</Button>
                <Button sx={{ borderRight: "4px solid" }}>-</Button>
              </li>
            ))}
          </ul>
        </Paper>
      </Box>
    </Box>
  );
}
