import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';

import { SelectField } from '../SelectField';

function ControlledSelect() {
  const [value, setValue] = useState('');
  return (
    <SelectField
      aria-label="Sort"
      value={value}
      onChange={setValue}
      options={[
        { value: '', label: 'Recommended' },
        { value: 'rating', label: 'Top rated' },
      ]}
    />
  );
}

describe('SelectField', () => {
  it('opens styled option list and selects a value', async () => {
    const user = userEvent.setup();
    render(<ControlledSelect />);

    await user.click(screen.getByLabelText('Sort'));
    await user.click(screen.getByRole('option', { name: 'Top rated' }));

    expect(screen.getByLabelText('Sort')).toHaveTextContent('Top rated');
  });
});
