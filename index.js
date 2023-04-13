import * as dotenv from 'dotenv'
dotenv.config()

import express from "express";
import https from 'https'
import url from 'url'
import fs from 'fs'
import helmet from "helmet";
import passport from "passport";
import GoogleStrategy from 'passport-google-oauth20'

const PORT = 3000

const config = {
    CLIENT_ID: process.env.CLIENT_ID,
    CLIENT_SECRET: process.env.CLIENT_SECRET
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

const app = express()

app.use(helmet())
app.use(passport.initialize())

function checkLoggedIn(req, res, next) {

    next()
}

app.get('/auth/google', passport.authenticate('google', { scope: ['email'] }))

app.get('/auth/google/callback', passport.authenticate('google', {
    failureRedirect: '/failure',
    successRedirect: '/',
    session: false
}), (req, res) => {
    console.log('Google called us back')
    return res.redirect('/');
})

app.get('/auth/logout', (req, res) => {

})


app.get('/failure', (req, res) => {
    return res.send('Failed to log in')
})
app.get('/secret', checkLoggedIn, (req, res) => {
    return res.send('Your personal secret value is 1')
})

app.get('/', (req, res) => {
    return res.sendFile(url.fileURLToPath(new URL('./public/index.html', import.meta.url)))
})

https
    .createServer({ key: fs.readFileSync('key.pem'), cert: fs.readFileSync('cert.pem') }, app)
    .listen(PORT, () => console.log('web server activated and listening at port ' + PORT))

