import type { Meta, StoryObj } from '@storybook/react';
import { Input } from '../components/Input';

const meta = {
  title: 'Atoms/Input',
  component: Input,
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    error: { control: 'text' },
    placeholder: { control: 'text' },
    type: { control: 'select', options: ['text', 'email', 'password', 'number'] },
  },
  args: {
    label: 'Email',
    placeholder: 'name@company.com',
    type: 'email',
    error: '',
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const ErrorState: Story = {
  args: {
    label: 'Work email',
    error: 'Please enter a valid company email.',
  },
};
