/// 단가 계산: floor(base_price * width * height / 90000)
pub fn calculate_unit_price(base_price: i64, width: i64, height: i64) -> i64 {
    (base_price * width * height) / 90000
}

/// 공급가액 계산: unit_price * quantity
pub fn calculate_supply_price(unit_price: i64, quantity: i64) -> i64 {
    unit_price * quantity
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_calculate_unit_price() {
        // base_price: 1000, width: 300, height: 300
        // 1000 * 300 * 300 / 90000 = 1000
        assert_eq!(calculate_unit_price(1000, 300, 300), 1000);

        // base_price: 500, width: 600, height: 900
        // 500 * 600 * 900 / 90000 = 3000
        assert_eq!(calculate_unit_price(500, 600, 900), 3000);
    }

    #[test]
    fn test_calculate_supply_price() {
        assert_eq!(calculate_supply_price(1000, 5), 5000);
        assert_eq!(calculate_supply_price(3000, 10), 30000);
    }
}
