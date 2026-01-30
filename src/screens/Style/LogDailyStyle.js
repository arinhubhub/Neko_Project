import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#E0F7FA', // Light cyan bg
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#00695C',
    },
    content: {
        padding: 16, // Reduced from 16 to fit larger items
        paddingBottom: 40,
    },
    questionText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#004D40',
        textAlign: 'center',
        marginBottom: 20,
    },
    statusContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 16,
        marginBottom: 24,
    },
    statusCard: {
        width: 140,
        height: 140,
        backgroundColor: '#80CBC4',
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        shadowRadius: 4,
        elevation: 3,
    },
    statusCardActive: {
        borderWidth: 3,
        borderColor: '#00695C',
        backgroundColor: '#4DB6AC'
    },
    statusText: {
        marginTop: 8,
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000',
    },
    section: {
        marginBottom: 24,
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#000',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between', // Spread out
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ccc',
        paddingHorizontal: 10,
        flex: 0.45, // Use percentage width for better spacing
        height: 40,
    },
    input: {
        flex: 1,
        height: 40,
        // backgroundColor: '#fff', // Removed to avoid overlap issues
        borderRadius: 8,
        paddingHorizontal: 10,
        // borderWidth: 1, // Remove inner border to avoid double border look
        // borderColor: '#ccc',
        color: '#000',
    },
    unit: {
        color: '#999',
        marginLeft: 4,
    },
    selectorContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        // px or gap can be adjusted here if needed
    },
    levelBtn: {
        alignItems: 'center',
        width: 60,
    },
    iconImg: {
        width: 45, // Adjusted to fit inside the new box
        height: 45,
        resizeMode: 'contain',
    },
    levelText: {
        fontSize: 14, // Increased from 10
        color: '#555',
        textAlign: 'center',
    },

    /* Grid Styles */
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        // gap: 12, // Removed gap, letting space-between handle 5 items
    },
    gridItem: {
        width: 70, // Matches levelBtn width
        alignItems: 'center',
        marginBottom: 12,
    },
    gridIconBtn: {
        width: 60, // Reduced to match standard levelBtn width better
        height: 60,
        borderRadius: 12,
        backgroundColor: '#F0F0F0', // Grey when not selected
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    gridIconBtnActive: {
        backgroundColor: '#FFFFFF', // Brighter white when selected
        // Removed green border as requested
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 4,
    },
    gridIconBtnActiveOrange: {
        backgroundColor: '#FFFDE7', // Light yellow/orange for Something off mode
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 4,
    },
    gridLabel: {
        fontSize: 14, // Increased from 10
        color: '#555',
        textAlign: 'center',
    },
    gridIconImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'contain',
    },


    saveButton: {
        backgroundColor: '#80CBC4',
        paddingVertical: 14,
        borderRadius: 25,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    saveButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    circle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#80CBC4',
        marginBottom: 4,
    },
    circleActive: {
        backgroundColor: '#80CBC4',
    },
    contentOff: {
        backgroundColor: '#FFE0B2', // ส้มอ่อน
    },
    statusCardOff: {
        backgroundColor: '#FFC107',
        borderColor: '#FF9800',
    },

    saveButtonOff: {
        backgroundColor: '#FFE082', // Yellowish orange for Save button in Something off mode
    },
});
