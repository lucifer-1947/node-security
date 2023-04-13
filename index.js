import * as dotenv from 'dotenv'
dotenv.config()

import express from "express";
import https from 'https'
import url from 'url'
import fs from 'fs'
import helmet from "helmet";
import passport from "passport";
import GoogleStrategy from 'passport-google-oauth20'
import cookieSession from 'cookie-session'

const PORT = 3000
const config = {
    CLIENT_ID: process.env.CLIENT_ID,
    CLIENT_SECRET: process.env.CLIENT_SECRET,
    COOKIE_KEY_1: process.env.COOKIE_KEY_1,
    COOKIE_KEY_2: process.env.COOKIE_KEY_2,
}

const AUTH_OPTIONS = {
    clientID: config.CLIENT_ID,
    clientSecret: config.CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
}
function verifyCallback(accessToken, refreshToken, profile, done) {
    console.log('Google profile', profile)
    done(null, profile)
}
passport.use(new GoogleStrategy(AUTH_OPTIONS, verifyCallback))


//save session to the cookie
passport.serializeUser((user,done)=>{
    //Note:Here we have data that is going to be placed in cookie.
    //We can database operations here.
    done(null,user.id);
})

//read session from cookie
passport.deserializeUser((id,done)=>{

    //Note:All the cookie data is now available. We can use this data to fetch database data for that user etc... operations can be performed
    console.log(id)
    done(null,id)
})


const app = express()

app.use(helmet())
app.use(cookieSession({
    name:'session',
    maxAge: 24 * 60 * 60 * 1000,
    keys:[config.COOKIE_KEY_1,config.COOKIE_KEY_2]
}))
app.use(passport.initialize())
app.use(passport.session())

function checkLoggedIn(req, res, next) {

    const isLoggedIn = req.isAuthenticated() && req.user;
    if(!isLoggedIn){
        return res.status(401).json({error:'You must log in! 😱'})
    }

    next()
}

app.get('/auth/google', passport.authenticate('google', { scope: ['email'] }))

app.get('/auth/google/callback', passport.authenticate('google', {
    failureRedirect: '/failure',
    successRedirect: '/',
    session: true
}), (req, res) => {
    console.log('Google called us back')
    return res.redirect('/');
})

app.get('/auth/logout', (req, res) => {
    req.logOut()
    res.redirect('/')
})


app.get('/failure', (req, res) => {
    return res.send('Failed to log in')
})
app.get('/secret', checkLoggedIn, (req, res) => {
    return res.send('Your personal secret value is 🤣')
})

app.get('/', (req, res) => {
    return res.sendFile(url.fileURLToPath(new URL('./public/index.html', import.meta.url)))
})

https
    .createServer({ key: fs.readFileSync('key.pem'), cert: fs.readFileSync('cert.pem') }, app)
    .listen(PORT, () => console.log('web server activated and listening at port ' + PORT))

