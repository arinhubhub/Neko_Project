export const FEED_DATA = [
  {
    id: "1",
    user: {
      id: "u3", // Changed from "u1" to show Hide/Block options
      name: "Tenlee_1001",
      avatar: "https://placekitten.com/100/100",
    },
    content: "Louis finally reached her goal weight!",
    image: "https://placekitten.com/400/300",
    likes: [],
    comments: [],
    createdAt: Date.now(),
  },
  {
    id: "2",
    user: {
      id: "u2", // Different user
      name: "CatLover_99",
      avatar: "https://placekitten.com/102/102",
    },
    content: "Anyone knows what breed this is? 🐱",
    image: null,
    likes: ["u1"],
    comments: [],
    createdAt: Date.now() - 3600000,
  },
];
