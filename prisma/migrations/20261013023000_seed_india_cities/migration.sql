-- Seed India country + cities for hotel tier autocomplete
INSERT INTO `master_country` (`id`, `code`, `name`)
VALUES ('country_in', 'IN', 'India')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `master_city` (`id`, `country_id`, `code`, `name`)
VALUES
  ('city_del', 'country_in', 'DEL', 'Delhi, Delhi'),
  ('city_bom', 'country_in', 'BOM', 'Mumbai, Maharashtra'),
  ('city_blr', 'country_in', 'BLR', 'Bengaluru, Karnataka'),
  ('city_hyd', 'country_in', 'HYD', 'Hyderabad, Telangana'),
  ('city_maa', 'country_in', 'MAA', 'Chennai, Tamil Nadu'),
  ('city_ccu', 'country_in', 'CCU', 'Kolkata, West Bengal'),
  ('city_pnq', 'country_in', 'PNQ', 'Pune, Maharashtra'),
  ('city_amd', 'country_in', 'AMD', 'Ahmedabad, Gujarat'),
  ('city_jai', 'country_in', 'JAI', 'Jaipur, Rajasthan'),
  ('city_lko', 'country_in', 'LKO', 'Lucknow, Uttar Pradesh'),
  ('city_cok', 'country_in', 'COK', 'Kochi, Kerala'),
  ('city_goi', 'country_in', 'GOI', 'Goa, Goa'),
  ('city_ixc', 'country_in', 'IXC', 'Chandigarh, Chandigarh'),
  ('city_nag', 'country_in', 'NAG', 'Nagpur, Maharashtra'),
  ('city_idr', 'country_in', 'IDR', 'Indore, Madhya Pradesh'),
  ('city_bbi', 'country_in', 'BBI', 'Bhubaneswar, Odisha'),
  ('city_pat', 'country_in', 'PAT', 'Patna, Bihar'),
  ('city_vns', 'country_in', 'VNS', 'Varanasi, Uttar Pradesh'),
  ('city_trv', 'country_in', 'TRV', 'Thiruvananthapuram, Kerala'),
  ('city_gau', 'country_in', 'GAU', 'Guwahati, Assam'),
  ('city_agr', 'country_in', 'AGR', 'Agra, Uttar Pradesh'),
  ('city_bdq', 'country_in', 'BDQ', 'Vadodara, Gujarat'),
  ('city_sur', 'country_in', 'SUR', 'Surat, Gujarat'),
  ('city_myq', 'country_in', 'MYQ', 'Mysuru, Karnataka'),
  ('city_cjb', 'country_in', 'CJB', 'Coimbatore, Tamil Nadu'),
  ('city_atq', 'country_in', 'ATQ', 'Amritsar, Punjab'),
  ('city_udr', 'country_in', 'UDR', 'Udaipur, Rajasthan'),
  ('city_jdh', 'country_in', 'JDH', 'Jodhpur, Rajasthan'),
  ('city_sxr', 'country_in', 'SXR', 'Srinagar, Jammu and Kashmir'),
  ('city_ixj', 'country_in', 'IXJ', 'Jammu, Jammu and Kashmir')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);
