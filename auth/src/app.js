const express=require('express');
const cookierParser=require('cookie-parser');
const authRoutes=require('./routes/auth.routes');

const app=express();
app.use(express.json());
app.use(cookierParser());
app.use('/api/auth', authRoutes);

module.exports=app;