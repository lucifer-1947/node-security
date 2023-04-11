import express from "express";
import https from 'https'
import url from 'url'
import fs from 'fs'
import helmet from "helmet";

const PORT = 3000

const app = express()

app.use(helmet())

app.get('/secret',(req,res)=>{
    res.send('Your personal secret value is 1')
})

app.get('/',(req,res)=>{
    res.sendFile(url.fileURLToPath( new URL('./public/index.html',import.meta.url)))
})

https
.createServer({key:fs.readFileSync('key.pem'),cert:fs.readFileSync('cert.pem')},app)
.listen(PORT,()=> console.log('web server activated and listening at port '+PORT))

