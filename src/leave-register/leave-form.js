import React, {  Component } from "react";
import "./leave.css";
import { Modal, Button } from 'react-bootstrap';
import { ListComponent } from "../leave-list/list";

export class LeaveComponent extends Component {
    constructor() {
        super()

        this.state = {
            email:'hr@gmail.com',
            subject:'',
            content:'',
            users:[],
            showModal: false
        }

        this.sendRequest = this.sendRequest.bind(this);
        this.fetchRequest = this.fetchRequest.bind(this);
        /* this.openModal = this.open.bind(this);
        this.closeModal = this.close.bind(this); */
        this.fetchRequest();
    }

    render() {
        return (
            <div className="form-wrapper">

                <form className="form-group">
                    <h4>
                        Leave Application
                    </h4>
                    <input className="form-control input-text" type="text" value =  {this.state.email} placeholder="Concern person" onChange = {event => {this.setState({email:event.target.value})}} />
                    <input className="form-control input-text" type="text" value =  {this.state.subject} placeholder="Subject" onChange = {event => {this.setState({subject:event.target.value})}} />
                    <textarea className="form-control input-text" value =  {this.state.content} placeholder="content" onChange = {event => {this.setState({content:event.target.value})}} rows="7"></textarea>

                    <div className = "d-flex flex-row justify-content-between">
                        <div>
                        <button className="form-control input-text btn btn-primary" type="button" onClick = {this.sendRequest}>Send</button>
                        </div>
                        <div>
                        <button className="form-control input-text btn btn-success" type="button" onClick = {this.fetchRequest}>Show</button>
                        </div>
                    </div>
                    
                </form>
                {/* <div className ="show-data">
                    <Modal className="modal-container" 
                        show={this.state.showModal} 
                        onHide={this.close}
                        animation={true} 
                        bsSize="small">

                        <Modal.Header closeButton>
                            <Modal.Title>Leave Application List</Modal.Title>
                        </Modal.Header>

                        <Modal.Body> */}
                            <ListComponent  list =  {this.state.users}/>
                        {/* </Modal.Body>

                        <Modal.Footer>
                            <Button onClick={this.close}>Close</Button>
                            <Button bsStyle="primary">Save changes</Button>
                        </Modal.Footer>         
                    </Modal>
                </div> */}
            </div>
        );
    }

    sendRequest() {
        var data = this.state;
        delete data.users;
        fetch('http://localhost:4000/save', {
            method:'POST',
            headers: { 
                'content-type': 'application/x-www-form-urlencoded',
                'Access-Control-Allow-Origin': '*' 
            },
            body:JSON.stringify(data)
        })        
        .then(response => 
            response.json().then(data => ({
                data: data,
                status: response.status
            })
        ))
        .then(res => {
            // console.log(res)
            this.fetchRequest()
        })
        .catch(console.log)
    }
    fetchRequest() {
        
        fetch('http://localhost:4000/fetch', {
            method:'POST',
            headers: { 
                'content-type': 'application/x-www-form-urlencoded',
                'Access-Control-Allow-Origin': '*' 
            }
        })
        .then(response => 
            response.json().then(data => ({
                data: data,
                status: response.status
            })
        ))
        .then(res => {
            this.setState({users:res.data.msg});
            this.setState({showModal: true})
        })
        .catch(console.log)
    }
    /* open() {
        this.setState({showModal: true});
    }
    
    close() {
        this.setState({showModal: false});
    } */
}