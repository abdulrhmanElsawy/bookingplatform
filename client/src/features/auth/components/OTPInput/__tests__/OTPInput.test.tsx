import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';

import i18n from '../../../../../i18n';
import { OTPInput } from '../OTPInput';

describe('OTPInput', () => {
  it('accepts digit input in RTL layout', async () => {
    await i18n.changeLanguage('ar');
    document.documentElement.dir = 'rtl';

    const onChange = jest.fn();
    const user = userEvent.setup();

    render(
      <I18nextProvider i18n={i18n}>
        <OTPInput value="" onChange={onChange} />
      </I18nextProvider>,
    );

    const boxes = screen.getAllByRole('textbox');
    expect(boxes).toHaveLength(6);

    await user.type(boxes[0], '1');
    expect(onChange).toHaveBeenCalledWith('1');
  });
});
