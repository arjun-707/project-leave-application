import React, { Component } from "react";

export class ListComponent extends Component {
    constructor(props) {
        super(props)   
        console.log(this.props.list)     
    }

    render() {
        return (
            
            <div>
                {
                    this.props.list.map(u => {
                        console.log(u.data)
                        return u.email;
                    })
                }
            </div>
        )
    }
}