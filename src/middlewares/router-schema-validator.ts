import * as z from 'zod';
import { Request, Response, NextFunction } from 'express';

function routerSchemaValidator(schema: z.AnyZodObject) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const { body } = await schema.parseAsync({
            body: req.body,
            param: req.params,
            query: req.query,
        })

        req.body = body;

        next();
    }
}

export default routerSchemaValidator;
