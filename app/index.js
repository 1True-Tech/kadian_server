import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

const app = express();
const port = 5000;
app.use(cors());
app.use(bodyParser.json());

app.get('/health', (_, res) => {
  res.json({
    status: 'ok',
    message: 'Server is running smoothly!'
  });
});

app.listen(port, ()=>{
    console.log(`Ayoo wagwan, enter your route through the port ahead ${port}`);
    console.log(`probably make it like this in your postman or browser; http://localhost:${port}`);
    console.log(`check the /health route to see if the server is running`);
})


