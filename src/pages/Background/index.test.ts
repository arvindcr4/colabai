const { render, screen } = require('@testing-library/react');
const Background = require('./index');

test('renders Background component', () => {
	render(<Background />);
	const element = screen.getByText(/background/i);
	expect(element).toBeInTheDocument();
});