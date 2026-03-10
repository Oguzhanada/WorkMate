import type { Meta, StoryObj } from '@storybook/react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

const meta = {
  title: 'Molecules/Card',
  component: Card,
  tags: ['autodocs'],
  args: {
    title: 'Pipeline Health',
    subtitle: 'Monitor your active deployment lanes',
    children: 'All systems are operational. 12 services healthy, 1 warning.',
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const WithActions: Story = {
  render: (args) => (
    <Card
      {...args}
      actions={<Button variant="secondary" size="sm">View details</Button>}
    />
  ),
};
