import React, { Component } from "react";

export class ListComponent extends Component {
    constructor(props) {
        super(props)

        console.log(this.props)

    }

    render() {
        return (
            
            <div>{this.props.list.map(u => {
                return u.email;
            })}</div>
        )
    }
}