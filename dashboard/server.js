const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

let orders = [];

app.post('/api/orders', (req, res) => {
    const newOrder = req.body;
    if (!newOrder || !newOrder.clientInfo || !newOrder.orderData) {
        return res.status(400).send({ message: 'Invalid order data' });
    }
    orders.push({ ...newOrder, timestamp: Date.now(), completed: false });
    console.log('New order received:', newOrder);
    res.status(200).send({ message: 'Order received successfully' });
});

app.get('/api/orders', (req, res) => {
    res.json(orders);
});

app.post('/api/orders/complete', (req, res) => {
    const { index } = req.body;
    if (isNaN(index) || index < 0 || index >= orders.length) {
        return res.status(404).send({ message: 'Order not found' });
    }
    orders[index].completed = true;
    console.log(`Order at index ${index} marked as completed`);
    res.status(200).send({ message: 'Order marked as completed' });
});

app.delete('/api/orders', (req, res) => {
    orders = [];
    console.log('All orders cleared');
    res.status(200).send({ message: 'All orders cleared' });
});

app.delete('/api/orders/:index', (req, res) => {
    const index = parseInt(req.params.index, 10);
    if (isNaN(index) || index < 0 || index >= orders.length) {
        return res.status(404).send({ message: 'Order not found' });
    }
    orders.splice(index, 1);
    console.log(`Order at index ${index} removed`);
    res.status(200).send({ message: 'Order removed successfully' });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
