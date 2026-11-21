import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { sampleCategories } from "@/.storybook/fixtures";
import { CatalogChipRow } from "./CatalogChipRow";
import { CatalogFilterChip } from "./CatalogFilterChip";

const meta = {
  title: "Catalog/CatalogChipRow",
  component: CatalogChipRow,
  tags: ["autodocs"],
  args: {
    label: "Filtre kategórií",
    showControls: true,
    children: null,
  },
} satisfies Meta<typeof CatalogChipRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const KratkyRad: Story = {
  args: {},
  render: (args) => (
    <div className="max-w-md">
      <CatalogChipRow {...args} label="Žánre">
        {sampleCategories.map((cat, index) => (
          <CatalogFilterChip
            key={cat.id}
            href={`/books?category=${cat.id}`}
            active={index === 0}
          >
            {cat.name}
          </CatalogFilterChip>
        ))}
      </CatalogChipRow>
    </div>
  ),
};

export const SPretecenim: Story = {
  args: {},
  render: (args) => (
    <div className="max-w-sm">
      <CatalogChipRow {...args} label="Filtre jazykov">
        {[
          "Slovenčina",
          "Čeština",
          "Angličtina",
          "Nemčina",
          "Francúzština",
          "Maďarčina",
          "Poľština",
          "Ruština",
          "Taliančina",
          "Španielčina",
        ].map((label, index) => (
          <CatalogFilterChip
            key={label}
            href={`/books?lang=${index}`}
            active={index === 0}
          >
            {label}
          </CatalogFilterChip>
        ))}
      </CatalogChipRow>
    </div>
  ),
};