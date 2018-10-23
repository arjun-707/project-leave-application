import React, { Component } from "react";

export class ListComponent extends Component {
    constructor(props) {
        super(props)
        this.approveRequest = this.approveRequest.bind(this);
    }

    render() {
        return (            
            <div>{
                    (this.props.list.length > 0) ?
                        <table className="table table-striped">                    
                            <thead>
                                <tr>
                                    <th>Email</th>
                                    <th>Subject</th>
                                    <th>Status</th>
                                    <th>Requested Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                { 
                                    this.props.list.map((data, index) => {
                                        return <tr key={index}>
                                            <td>{ data.email }</td>
                                            <td>{ data.content.subject }</td>
                                            <td>{ 
                                                    data.approved ? 
                                                        <button className="form-control input-text btn btn-success" type="button" user-email={ data.email } disabled>Approved</button> 
                                                    : 
                                                        <button className="form-control input-text btn btn-info" type="button" onClick = {this.approveRequest} user-email={ data.email } >Pending</button> 
                                                }
                                            </td>
                                            <td>{ data.added_time }</td>
                                        </tr>;
                                    })    
                                }
                            </tbody>
                        </table>
                    : 
                    <div className="alert alert-info">
                        No data found
                    </div>
                }
            </div>
        )
    }
    approveRequest(event) {
        event.target.attributes.setNamedItem(document.createAttribute("disabled"))
        event.persist()
        fetch('http://localhost:4000/approve', {
            method:'POST',
            headers: { 
                'content-type': 'application/x-www-form-urlencoded',
                'Access-Control-Allow-Origin': '*' 
            },
            body:JSON.stringify({email: event.target.attributes.getNamedItem('user-email').value})
        })        
        .then(response => 
            response.json().then(data => ({
                data: data,
                status: response.status
            })
        ))
        .then(res => {
            console.log(res)
            if (res.hasOwnProperty('data')) {
                if (!res.data.error) {
                    event.target.innerHTML = 'Approved'
                    event.target.classList.remove("btn-info")
                    event.target.classList.add("btn-success")
                }
                else {
                    event.target.attributes.disabled = false
                    alert(res.msg)
                }
            }
            else
                event.target.attributes.disabled = false
        })
        .catch(console.log)
    }
}