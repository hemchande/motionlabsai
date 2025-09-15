'use client';

import LayoutWrapper from '@/components/LayoutWrapper';
import { GymnasticsAPIIntegration } from '@/components/GymnasticsAPIIntegration';

export default function APIDemoPage() {
  return (
    <LayoutWrapper>
      <div className="container mx-auto py-8">
        <GymnasticsAPIIntegration />
      </div>
    </LayoutWrapper>
  );
}
