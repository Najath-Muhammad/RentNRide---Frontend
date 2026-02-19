import { createFileRoute } from '@tanstack/react-router'
import CategoryManagement from '../../../pages/admin/category.management'

export const Route = createFileRoute('/admin/category-management/')({
  component: CategoryManagement,
})

