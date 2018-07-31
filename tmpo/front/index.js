import { h, render, Component } from 'preact';
import linkState from 'linkstate';

/** @jsx h */

import './style.scss';


const Line = ({line, open}) => {
	let parts = line.split(":")
	let num = parts.shift()
	let code = parts.join(":")
	return (
		<p onclick={() => open(num)}><span>{num}</span>{code}</p>
	)
}


class Result extends Component {

	openFile = (file) => (num) => {
		console.log('file opened', file, num)
		fetch(`http://localhost:8080/-/open?f=${file}&l=${num}`)
	}


	render({i, file, lines, q}, state) {
		return (
			<div class="result">
				<h2><span>{i}.</span> {file}</h2>
				<pre>{lines.map(line => (
					<Line line={line} q={q} open={this.openFile(file)} />
				))}
				</pre>
			</div>
		)
	}
}



class FileSearcher extends Component {

	state = {
		q: '',
		result: [],
		opened: false,
		total: 0
	};

	doSearch = (event) => {
		event.preventDefault();
		let q = this.state.q;
		if (q.indexOf(" ") !== -1) {
			q = "%22" + q + "%22"
		}

		const url = "ws://localhost:8080/-/search?q=" + q
		const socket = new WebSocket(url)
		this.setState({
			opened:true,
			result: []
		})
		socket.onmessage = ({data}) => {
			const obj = JSON.parse(data);
			this.setState({
				result: [obj, ...this.state.result],
				total: obj.found
			})
		}
		socket.onclose = (event) => {
			this.setState({opened:false})
		}

		return false
	}

	render(props, {result, opened, total, q}) {
		return (
			<div className="filesearch">
				<h1>Search files: </h1>
				<form onSubmit={this.doSearch}>
					<input type="text" onInput={linkState(this, 'q')} />
					<button type="submit">go!</button>
				</form>
				<div class="results">
					WS is <span>{(opened) ? 'opened' : 'closed'}</span><br/>
					Total Results: <span>{total}</span>
				</div>
				{result.length > 0 && result.map((obj, i) => 
					( <Result {...obj} i={i} q={q} /> )
				)}

			</div>
		)
	}


}



addEventListener('DOMContentLoaded', () =>{
	render(<FileSearcher />, document.getElementById('main'));
})