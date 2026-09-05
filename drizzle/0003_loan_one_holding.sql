CREATE UNIQUE INDEX "loan_one_holding_open_uidx" ON "loan" USING btree ("holding_id") WHERE "returned_at" IS NULL AND "holding_id" IS NOT NULL;
