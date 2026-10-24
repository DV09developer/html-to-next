import { z } from "zod";

export const componentPropSchema = z.object({
    name: z.string().min(1),
    type: z.string().min(1),
    required: z.boolean(),
    defaultValue: z.string().optional(),
});

export type ComponentProp = z.infer<typeof componentPropSchema>;

export const componentNodeSchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    type: z.enum(["page", "component"]),
    sourcePaths: z.array(z.string()),
    children: z.array(z.string()),
    props: z.array(componentPropSchema),
});

export type ComponentNode = z.infer<typeof componentNodeSchema>;

export const componentTreeSchema = z.object({
    rootId: z.string().min(1),
    nodes: z.array(componentNodeSchema),
});

export type ComponentTree = z.infer<typeof componentTreeSchema>;
