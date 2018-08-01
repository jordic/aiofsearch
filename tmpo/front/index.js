import { h, render, Component } from 'preact';
import linkState from 'linkstate';
// import VirtualList from 'preact-virtual-list'
import ScrollViewport from 'preact-scroll-viewport';

/** @jsx h */

import './style.scss';


const Line = ({line, open}) => {
	let parts = line.split(":")
	let num = parts.shift()
	let code = parts.join(":")
	return (
		<p onclick={() => open(num)}><span>{num}</span>{code.slice(0,150)}</p>
	)
}


class Result extends Component {

	openFile = (file) => (num) => {
		console.log('file opened', file, num)
		fetch(`http://localhost:8080/-/open?f=${file}&l=${num}`)
	}


	render({file, lines, q, item}, state) {
		return (
			<div class="result" style="overflow:hidden;" key={item}>
				<h2><span>{item}</span> {file}</h2>
				<pre>{lines.slice(0, 10).map(line => (
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

	items = []

	doSearch = (event) => {
		event.preventDefault();
		let q = this.state.q;
		if (q.indexOf(" ") !== -1) {
			q = "%22" + q + "%22"
		}

		this.rinput.blur()
		// Cleanup socket if running
		if (this.socket) {
			this.socket.close()
		}

		let counter = 1;
		const url = "ws://localhost:8080/-/search?q=" + q
		this.socket = new WebSocket(url)
		this.items = []
		this.setState({
			opened:true,
			result: [],
			total: 0
		})
		this.socket.onmessage = ({data}) => {
			const obj = JSON.parse(data);
			obj.item = counter++;
			this.items.push(obj)
		}
		// debounce rendering on large datasets
		this.inter = setInterval(() => {
			this.setState({
				result: this.items,
				total: this.items.length
			});
		}, 1000);

		this.socket.onclose = (event) => {
			this.setState({opened:false})
			console.log('on socket close')
			// delete this.socket.onmessage;
			clearInterval(this.inter);
			this.socket = undefined;
			this.setState({
				result: this.items,
				total: this.items.length
			});
		}

		return false
	}

	shouldComponentUpdate(nextProps, nextState) {
		if (nextState.q != this.state.q) {
			return false;
		}
		return true;
	}

	clean = (event) => {
		event.preventDefault();
		this.close()
	}

	close = () => {
		if (this.socket) {
			this.socket.send('close');
			this.socket.close()
		}
	}


	render(props, {result, opened, total, q}) {
		return (
			<div className="filesearch">
				<h1>Search files: </h1>
				<form onSubmit={this.doSearch}>
					<input type="text" 
						onInput={linkState(this, 'q')} 
						onFocus={this.clean}
						ref={el => this.rinput = el}
						/>
					<button type="submit">go!</button>
					{opened && <button onClick={this.clean}>X</button> }
				</form>
				<div class="results">
					WS is <span>{(opened) ? 'opened' : 'closed'}</span><br/>
					Total Results: <strong>{total}</strong>
					{opened && <div className="spinner"></div>}
				</div>
				{result.length > 0 && 
					<ScrollViewport defaultRowHeight={120}>
						{result.map(row => ( <Result {...row} q={q} /> ))}
					</ScrollViewport>	
				}

			</div>
		)
	}


}



addEventListener('DOMContentLoaded', () =>{
	render(<FileSearcher />, document.getElementById('main'));
})