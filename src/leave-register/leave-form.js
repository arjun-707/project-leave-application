import React, {  Component } from "react";

import { ListComponent } from "../leave-list/list";
const axios = require('axios');
export class LeaveComponent extends Component {
    constructor() {
        super()

        this.state = {
            email:'hr@gmail.com',
            subject:'',
            content:'',
            users:[]
        }

        this.sendRequest = this.sendRequest.bind(this);
    }

    render() {
        return (
            <div>
                <input type="text" value =  {this.state.email} placeholder="Concern person" onChange = {event => {this.setState({email:event.target.value})}} />
                <input type="text" value =  {this.state.subject} placeholder="Subject" onChange = {event => {this.setState({subject:event.target.value})}} />
                <input type="text" value =  {this.state.content} placeholder="content" onChange = {event => {this.setState({content:event.target.value})}} />
                <button type="button" onClick = {this.sendRequest}>Send</button>

                <div>
                    <ListComponent  list =  {this.state.users}/>
                </div>
            </div>
        );
    }

    sendRequest() {
        var data = this.state;
        delete data.users;
        fetch('http://localhost:4000/save', {
            method:'POST',
            mode: 'no-cors',
            headers: { 
                'content-type': 'application/x-www-form-urlencoded',
                'Access-Control-Allow-Origin': '*' 
            },
            body:JSON.stringify(data)
        })
        // .then(response => response.json())
        .then(u => {
            console.log(u)
            this.fetchRequest();
            // this.setState({users: u})
        })
    }
    fetchRequest() {
        
        fetch('http://localhost:4000/fetch', {
            method:'POST',
            mode: 'no-cors',
            headers: { 
                'content-type': 'application/x-www-form-urlencoded',
                'Access-Control-Allow-Origin': '*' 
            }
        })
        // .then(response => response.json())
        .then(u => {
            console.log(u)
            // this.setState({users: u})
        })
    }
}